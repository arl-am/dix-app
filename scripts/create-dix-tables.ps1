$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$OrgUrl   = "https://org71748d11.crm.dynamics.com"
$clientId = "51f81489-12ee-4a9e-aaae-a2591f45987d"
$tenantId = "1ab993e6-5837-45e4-a231-6466807ddb34"
$resource = "$OrgUrl/.default"
$solution = "DIXApp"

# ─── DEVICE CODE AUTH ────────────────────────────────────────────────
$codeReq = Invoke-RestMethod -Method POST `
    -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/devicecode" `
    -Body @{ client_id = $clientId; scope = $resource }
Write-Host $codeReq.message -ForegroundColor Yellow

$token = $null; $waited = 0
while (-not $token -and $waited -lt $codeReq.expires_in) {
    Start-Sleep -Seconds $codeReq.interval; $waited += $codeReq.interval
    try {
        $t = Invoke-RestMethod -Method POST `
            -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
            -Body @{
                grant_type  = "urn:ietf:params:oauth:grant-type:device_code"
                client_id   = $clientId
                device_code = $codeReq.device_code
            }
        $token = $t.access_token
    } catch {
        $e = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($e.error -eq "authorization_pending") { continue }
        throw
    }
}
if (-not $token) { Write-Host "Auth timed out" -ForegroundColor Red; exit 1 }
Write-Host "Authenticated!" -ForegroundColor Green

# ─── HEADERS ─────────────────────────────────────────────────────────
$baseHeaders = @{
    "Authorization"      = "Bearer $token"
    "OData-MaxVersion"   = "4.0"
    "OData-Version"      = "4.0"
    "Accept"             = "application/json"
    "Content-Type"       = "application/json; charset=utf-8"
    "MSCRM.SolutionName" = $solution
}

# ─── HELPERS ─────────────────────────────────────────────────────────
function Invoke-DV {
    param([string]$Method, [string]$Uri, [object]$Body)
    $params = @{ Method = $Method; Uri = "$OrgUrl$Uri"; Headers = $baseHeaders }
    if ($Body) {
        $json  = $Body | ConvertTo-Json -Depth 10 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $params.Body        = $bytes
        $params.ContentType = "application/json; charset=utf-8"
    }
    Invoke-RestMethod @params
}

function New-Table {
    param([string]$SchemaName, [string]$DisplayName, [string]$PluralName, [array]$Columns, [string]$PrimaryCol = "cr6cd_dix_name")

    $attrs = @(
        @{
            "@odata.type"           = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
            SchemaName              = $PrimaryCol
            DisplayName             = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Name"; LanguageCode = 1033 }) }
            Description             = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Primary name column"; LanguageCode = 1033 }) }
            RequiredLevel           = @{ Value = "ApplicationRequired"; CanBeChanged = $true }
            MaxLength               = 200
            IsPrimaryName           = $true
        }
    )
    $attrs += $Columns

    $body = @{
        "@odata.type"          = "Microsoft.Dynamics.CRM.EntityMetadata"
        SchemaName             = $SchemaName
        DisplayName            = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 }) }
        DisplayCollectionName  = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $PluralName; LanguageCode = 1033 }) }
        Description            = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 }) }
        HasActivities          = $false
        HasNotes               = $false
        OwnershipType          = "UserOwned"
        IsActivity             = $false
        Attributes             = $attrs
    }

    Write-Host "Creating table $SchemaName ($DisplayName)..." -ForegroundColor Cyan
    Invoke-DV -Method POST -Uri "/api/data/v9.2/EntityDefinitions" -Body $body
    Write-Host "  -> Created $SchemaName" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

function StringCol {
    param([string]$Schema, [string]$Label, [int]$MaxLen = 200, [string]$Required = "None")
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = $Required; CanBeChanged = $true }
        MaxLength     = $MaxLen
    }
}

function MemoCol {
    param([string]$Schema, [string]$Label, [int]$MaxLen = 2000)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        MaxLength     = $MaxLen
    }
}

function IntCol {
    param([string]$Schema, [string]$Label)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.IntegerAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        MinValue      = 0
        MaxValue      = 2147483647
    }
}

function CurrencyCol {
    param([string]$Schema, [string]$Label)
    @{
        "@odata.type"  = "Microsoft.Dynamics.CRM.MoneyAttributeMetadata"
        SchemaName     = $Schema
        DisplayName    = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description    = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel  = @{ Value = "None"; CanBeChanged = $true }
        PrecisionSource = 2
    }
}

function DecimalCol {
    param([string]$Schema, [string]$Label)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.DecimalAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        MinValue      = 0
        MaxValue      = 1000000000
        Precision     = 2
    }
}

function DateCol {
    param([string]$Schema, [string]$Label)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        Format        = "DateOnly"
        DateTimeBehavior = @{ Value = "DateOnly" }
    }
}

function BoolCol {
    param([string]$Schema, [string]$Label, [bool]$Default = $false)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.BooleanAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        DefaultValue  = $Default
        OptionSet     = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata"
            TrueOption    = @{ Value = 1; Label = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Yes"; LanguageCode = 1033 }) } }
            FalseOption   = @{ Value = 0; Label = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "No"; LanguageCode = 1033 }) } }
        }
    }
}

function ChoiceCol {
    param([string]$Schema, [string]$Label, [array]$Options)
    $opts = @()
    $val = 100000000
    foreach ($o in $Options) {
        $opts += @{
            Value = $val
            Label = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $o; LanguageCode = 1033 }) }
        }
        $val++
    }
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Label; LanguageCode = 1033 }) }
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        OptionSet     = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.OptionSetMetadata"
            IsGlobal      = $false
            OptionSetType = "Picklist"
            Options       = $opts
        }
    }
}

function New-Lookup {
    param([string]$SchemaName, [string]$DisplayName, [string]$ReferencingEntity, [string]$ReferencedEntity)

    $body = @{
        "@odata.type"              = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
        SchemaName                 = $SchemaName
        ReferencingEntity          = $ReferencingEntity
        ReferencedEntity           = $ReferencedEntity
        CascadeConfiguration       = @{
            Assign   = "NoCascade"
            Delete   = "RemoveLink"
            Merge    = "NoCascade"
            Reparent = "NoCascade"
            Share    = "NoCascade"
            Unshare  = "NoCascade"
            RollupView = "NoCascade"
        }
        Lookup                     = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
            SchemaName    = $SchemaName
            DisplayName   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 }) }
            Description   = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "$DisplayName lookup"; LanguageCode = 1033 }) }
            RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        }
    }

    Write-Host "Creating lookup $SchemaName ($ReferencingEntity -> $ReferencedEntity)..." -ForegroundColor Cyan
    Invoke-DV -Method POST -Uri "/api/data/v9.2/RelationshipDefinitions" -Body $body
    Write-Host "  -> Created lookup $SchemaName" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# =====================================================================
# STEP 1 — INDEPENDENT TABLES
# =====================================================================
Write-Host "`n=== STEP 1: Independent Tables ===" -ForegroundColor Magenta

# 1. cr6cd_dix_vendor
New-Table -SchemaName "cr6cd_dix_vendor" -DisplayName "DIX Vendor" -PluralName "DIX Vendors" -Columns @(
    (StringCol "cr6cd_dix_vendorcode"    "Vendor Code")
    (StringCol "cr6cd_dix_businessname"  "Business Name")
    (StringCol "cr6cd_dix_einnumber"     "EIN Number")
    (StringCol "cr6cd_dix_phonenumber"   "Phone Number")
    (StringCol "cr6cd_dix_streetaddress" "Street Address")
    (StringCol "cr6cd_dix_city"          "City")
    (StringCol "cr6cd_dix_state"         "State")
    (StringCol "cr6cd_dix_zipcode"       "Zip Code")
)

# 2. cr6cd_dix_unit
New-Table -SchemaName "cr6cd_dix_unit" -DisplayName "DIX Unit" -PluralName "DIX Units" -Columns @(
    (StringCol  "cr6cd_dix_unitnumber"    "Unit Number")
    (StringCol  "cr6cd_dix_make"          "Make")
    (StringCol  "cr6cd_dix_model"         "Model")
    (IntCol     "cr6cd_dix_year"          "Year")
    (StringCol  "cr6cd_dix_color"         "Color")
    (StringCol  "cr6cd_dix_vin"           "VIN")
    (CurrencyCol "cr6cd_dix_truckvalue"       "Truck Value")
    (DecimalCol  "cr6cd_dix_unladenweight"   "Unladen Weight")
    (DateCol     "cr6cd_dix_purchasedate"    "Purchase Date")
    (StringCol   "cr6cd_dix_lienholdername"  "Lienholder Name")
    (StringCol   "cr6cd_dix_lienholderaddress" "Lienholder Address" 500)
)

# 3. cr6cd_dix_appsetting
New-Table -SchemaName "cr6cd_dix_appsetting" -DisplayName "DIX App Setting" -PluralName "DIX App Settings" -Columns @(
    (StringCol "cr6cd_dix_value"       "Value" 2000)
    (StringCol "cr6cd_dix_description" "Description" 500)
    (BoolCol   "cr6cd_dix_isactive"    "Is Active" $true)
)

# =====================================================================
# STEP 2 — MAIN TABLE
# =====================================================================
Write-Host "`n=== STEP 2: Driver Table ===" -ForegroundColor Magenta

New-Table -SchemaName "cr6cd_dix_driver" -DisplayName "DIX Driver" -PluralName "DIX Drivers" -Columns @(
    (StringCol  "cr6cd_dix_drivercode"          "Driver Code")
    (ChoiceCol  "cr6cd_dix_contracttype"         "Contract Type" @("Owner Operator","Company Driver","Lease"))
    (ChoiceCol  "cr6cd_dix_actiontype"           "Action Type"   @("Add","Equipment Return","Contract End","Medical"))
    (StringCol  "cr6cd_dix_createdbyname"        "Created By Name")
    (StringCol  "cr6cd_dix_email"                "Email")
    (StringCol  "cr6cd_dix_phonenumber"          "Phone Number")
    (StringCol  "cr6cd_dix_ssn"                  "SSN")
    (StringCol  "cr6cd_dix_licensenumber"        "License Number")
    (StringCol  "cr6cd_dix_licensestate"         "License State")
    (DateCol    "cr6cd_dix_licenseexpdate"       "License Expiration Date")
    (StringCol  "cr6cd_dix_streetaddress"        "Street Address")
    (StringCol  "cr6cd_dix_city"                 "City")
    (StringCol  "cr6cd_dix_state"                "State")
    (StringCol  "cr6cd_dix_zipcode"              "Zip Code")
    (DateCol    "cr6cd_dix_onboardingdate"       "Onboarding Date")
    (BoolCol    "cr6cd_dix_isactive"             "Is Active" $true)
    (StringCol  "cr6cd_dix_fuelcardnumber"       "Fuel Card Number")
    (BoolCol    "cr6cd_dix_elprequired"          "ELP Required")
    (BoolCol    "cr6cd_dix_hazmat"               "Hazmat")
    (BoolCol    "cr6cd_dix_homelandsecurity"     "Homeland Security")
    (BoolCol    "cr6cd_dix_reactivateequipment"  "Reactivate Equipment")
    (BoolCol    "cr6cd_dix_transferequipment"    "Transfer Equipment")
    (BoolCol    "cr6cd_dix_transferoccacc"       "Transfer OCC/ACC")
)

# =====================================================================
# STEP 3 — DRIVER-LINKED TABLES
# =====================================================================
Write-Host "`n=== STEP 3: Driver-linked Tables ===" -ForegroundColor Magenta

# 5. cr6cd_dix_driverdeduction
New-Table -SchemaName "cr6cd_dix_driverdeduction" -DisplayName "DIX Driver Deduction" -PluralName "DIX Driver Deductions" -Columns @(
    (StringCol   "cr6cd_dix_deductionkey" "Deduction Key" 50 "ApplicationRequired")
    (BoolCol     "cr6cd_dix_selected"     "Selected")
    (CurrencyCol "cr6cd_dix_customvalue"  "Custom Value")
    (StringCol   "cr6cd_dix_iftanumber"   "IFTA Number" 50)
)

# 6. cr6cd_dix_cancellation
New-Table -SchemaName "cr6cd_dix_cancellation" -DisplayName "DIX Cancellation" -PluralName "DIX Cancellations" -Columns @(
    (MemoCol     "cr6cd_dix_cancellationreason" "Cancellation Reason")
    (DateCol     "cr6cd_dix_requestdate"        "Request Date")
    (MemoCol     "cr6cd_dix_notes"              "Notes" 4000)
    (BoolCol     "cr6cd_dix_approved"           "Approved")
    (CurrencyCol "cr6cd_dix_amount"             "Amount")
    (DateCol     "cr6cd_dix_deductiondate"      "Deduction Date")
    (StringCol   "cr6cd_dix_reason"             "Reason")
)

# 7. cr6cd_dix_deduction
New-Table -SchemaName "cr6cd_dix_deduction" -DisplayName "DIX Deduction" -PluralName "DIX Deductions" -Columns @(
    (StringCol   "cr6cd_dix_deductiondescription" "Deduction Description")
    (CurrencyCol "cr6cd_dix_amount"               "Amount")
    (DateCol     "cr6cd_dix_deductiondate"        "Deduction Date")
    (StringCol   "cr6cd_dix_reason"               "Reason")
)

# 8. cr6cd_dix_terminalmove
New-Table -SchemaName "cr6cd_dix_terminalmove" -DisplayName "DIX Terminal Move" -PluralName "DIX Terminal Moves" -Columns @(
    (DateCol   "cr6cd_dix_movedate"      "Move Date")
    (StringCol "cr6cd_dix_movereference" "Move Reference" 100)
    (StringCol "cr6cd_dix_documenturl"   "Document URL" 500)
)

# =====================================================================
# STEP 4 — LOOKUPS
# =====================================================================
Write-Host "`n=== STEP 4: Lookups (waiting 3s for tables to propagate) ===" -ForegroundColor Magenta
Start-Sleep -Seconds 3

# Driver -> Agents (Terminal Agent)
New-Lookup -SchemaName "cr6cd_dix_agent" -DisplayName "Terminal Agent" `
    -ReferencingEntity "cr6cd_dix_driver" -ReferencedEntity "cr6cd_agents"

# Driver -> Vendor
New-Lookup -SchemaName "cr6cd_dix_vendor" -DisplayName "Vendor" `
    -ReferencingEntity "cr6cd_dix_driver" -ReferencedEntity "cr6cd_dix_vendor"

# Driver -> Unit
New-Lookup -SchemaName "cr6cd_dix_unit" -DisplayName "Unit" `
    -ReferencingEntity "cr6cd_dix_driver" -ReferencedEntity "cr6cd_dix_unit"

# Driver Deduction -> Driver
New-Lookup -SchemaName "cr6cd_dix_deductiondriver" -DisplayName "Driver" `
    -ReferencingEntity "cr6cd_dix_driverdeduction" -ReferencedEntity "cr6cd_dix_driver"

# Cancellation -> Driver
New-Lookup -SchemaName "cr6cd_dix_cancdriver" -DisplayName "Driver" `
    -ReferencingEntity "cr6cd_dix_cancellation" -ReferencedEntity "cr6cd_dix_driver"

# Deduction -> Driver
New-Lookup -SchemaName "cr6cd_dix_deddriver" -DisplayName "Driver" `
    -ReferencingEntity "cr6cd_dix_deduction" -ReferencedEntity "cr6cd_dix_driver"

# Terminal Move -> Driver
New-Lookup -SchemaName "cr6cd_dix_movedriver" -DisplayName "Driver" `
    -ReferencingEntity "cr6cd_dix_terminalmove" -ReferencedEntity "cr6cd_dix_driver"

# Terminal Move -> Agents (Origin Terminal)
New-Lookup -SchemaName "cr6cd_dix_originterminal" -DisplayName "Origin Terminal" `
    -ReferencingEntity "cr6cd_dix_terminalmove" -ReferencedEntity "cr6cd_agents"

# Terminal Move -> Agents (Destination Terminal)
New-Lookup -SchemaName "cr6cd_dix_destinationterminal" -DisplayName "Destination Terminal" `
    -ReferencingEntity "cr6cd_dix_terminalmove" -ReferencedEntity "cr6cd_agents"

Write-Host "`n=== ALL DONE! 8 tables + 10 lookups created in DIXApp ===" -ForegroundColor Green
