$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$OrgUrl   = "https://org71748d11.crm.dynamics.com"
$clientId = "51f81489-12ee-4a9e-aaae-a2591f45987d"
$tenantId = "1ab993e6-5837-45e4-a231-6466807ddb34"
# offline_access keeps a refresh token so we don't need a new device code for ~90 days.
$scope    = "$OrgUrl/.default offline_access"
$solution = "DIXApp"

$cacheFile = Join-Path $PSScriptRoot ".auth-cache.json"

function Save-Cache($accessToken, $refreshToken, $expiresIn) {
    $cache = @{
        access_token  = $accessToken
        refresh_token = $refreshToken
        # Treat token as expired 60s early to avoid edge races.
        expires_at    = ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + [int]$expiresIn - 60)
    } | ConvertTo-Json
    [System.IO.File]::WriteAllText($cacheFile, $cache, [System.Text.UTF8Encoding]::new($false))
}

function Try-RefreshToken($refreshToken) {
    try {
        $r = Invoke-RestMethod -Method POST `
            -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
            -Body @{
                grant_type    = "refresh_token"
                client_id     = $clientId
                refresh_token = $refreshToken
                scope         = $scope
            }
        Save-Cache $r.access_token $r.refresh_token $r.expires_in
        return $r.access_token
    } catch {
        Write-Host "Refresh token rejected, falling back to device code..." -ForegroundColor Yellow
        return $null
    }
}

function Get-Token {
    if (Test-Path $cacheFile) {
        $cache = Get-Content $cacheFile -Raw | ConvertFrom-Json
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        if ($cache.expires_at -gt $now -and $cache.access_token) {
            Write-Host "Using cached access token (expires in $([int](($cache.expires_at - $now) / 60))m)" -ForegroundColor Green
            return $cache.access_token
        }
        if ($cache.refresh_token) {
            Write-Host "Cached token expired, attempting refresh..." -ForegroundColor Yellow
            $tok = Try-RefreshToken $cache.refresh_token
            if ($tok) { Write-Host "Refreshed!" -ForegroundColor Green; return $tok }
        }
    }

    # Device code flow
    $codeReq = Invoke-RestMethod -Method POST `
        -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/devicecode" `
        -Body @{ client_id = $clientId; scope = $scope }
    Write-Host "" -NoNewline
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host $codeReq.message -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Cyan

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
            Save-Cache $t.access_token $t.refresh_token $t.expires_in
            $token = $t.access_token
        } catch {
            $e = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($e.error -eq "authorization_pending") { continue }
            throw
        }
    }
    if (-not $token) { throw "Auth timed out" }
    Write-Host "Authenticated and cached." -ForegroundColor Green
    return $token
}

$token = Get-Token

$baseHeaders = @{
    "Authorization"      = "Bearer $token"
    "OData-MaxVersion"   = "4.0"
    "OData-Version"      = "4.0"
    "Accept"             = "application/json"
    "Content-Type"       = "application/json; charset=utf-8"
    "MSCRM.SolutionName" = $solution
}

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

function Is-AlreadyExistsError($errorRecord) {
    # Pass the full $_ ErrorRecord. The Dataverse JSON body is on $_.ErrorDetails.Message,
    # not on $_.Exception.Message (which is the generic HTTP wrapper text).
    $msg = ""
    if ($errorRecord.ErrorDetails -and $errorRecord.ErrorDetails.Message) {
        $msg = $errorRecord.ErrorDetails.Message
    } else {
        $msg = $errorRecord.Exception.Message
    }
    return $msg -match "already exists" `
        -or $msg -match "Duplicate" `
        -or $msg -match "0x80048408" `
        -or $msg -match "0x80047013" `
        -or $msg -match "0x80072551" `
        -or $msg -match "is not unique within an entity" `
        -or $msg -match "An attribute with the specified name" `
        -or $msg -match "An entity with the specified name"
}

function Label { param([string]$Text) @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Text; LanguageCode = 1033 }) } }

function StringCol {
    param([string]$Schema, [string]$DisplayLabel, [int]$MaxLen = 200, [string]$Required = "None")
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = (Label $DisplayLabel)
        Description   = (Label $DisplayLabel)
        RequiredLevel = @{ Value = $Required; CanBeChanged = $true }
        MaxLength     = $MaxLen
    }
}

function MemoCol {
    param([string]$Schema, [string]$DisplayLabel, [int]$MaxLen = 2000)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = (Label $DisplayLabel)
        Description   = (Label $DisplayLabel)
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        MaxLength     = $MaxLen
    }
}

function DateCol {
    param([string]$Schema, [string]$DisplayLabel)
    @{
        "@odata.type"    = "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata"
        SchemaName       = $Schema
        DisplayName      = (Label $DisplayLabel)
        Description      = (Label $DisplayLabel)
        RequiredLevel    = @{ Value = "None"; CanBeChanged = $true }
        Format           = "DateOnly"
        DateTimeBehavior = @{ Value = "DateOnly" }
    }
}

function BoolCol {
    param([string]$Schema, [string]$DisplayLabel, [bool]$Default = $false)
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.BooleanAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = (Label $DisplayLabel)
        Description   = (Label $DisplayLabel)
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        DefaultValue  = $Default
        OptionSet     = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata"
            TrueOption    = @{ Value = 1; Label = (Label "Yes") }
            FalseOption   = @{ Value = 0; Label = (Label "No") }
        }
    }
}

function CurrencyCol {
    param([string]$Schema, [string]$DisplayLabel)
    @{
        "@odata.type"   = "Microsoft.Dynamics.CRM.MoneyAttributeMetadata"
        SchemaName      = $Schema
        DisplayName     = (Label $DisplayLabel)
        Description     = (Label $DisplayLabel)
        RequiredLevel   = @{ Value = "None"; CanBeChanged = $true }
        PrecisionSource = 2
    }
}

function ChoiceCol {
    param([string]$Schema, [string]$DisplayLabel, [array]$Options)
    $opts = @()
    $val = 100000000
    foreach ($o in $Options) {
        $opts += @{ Value = $val; Label = (Label $o) }
        $val++
    }
    @{
        "@odata.type" = "Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
        SchemaName    = $Schema
        DisplayName   = (Label $DisplayLabel)
        Description   = (Label $DisplayLabel)
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        OptionSet     = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.OptionSetMetadata"
            IsGlobal      = $false
            OptionSetType = "Picklist"
            Options       = $opts
        }
    }
}

function Add-Column {
    param([string]$EntityLogical, [hashtable]$Attr)
    try {
        Invoke-DV -Method POST -Uri "/api/data/v9.2/EntityDefinitions(LogicalName='$EntityLogical')/Attributes" -Body $Attr
        Write-Host "  + $($Attr.SchemaName)" -ForegroundColor Cyan
        Start-Sleep -Milliseconds 500
    } catch {
        if (Is-AlreadyExistsError $_) {
            Write-Host "  = $($Attr.SchemaName) (already exists, skipped)" -ForegroundColor DarkGray
        } else {
            Write-Host "  ! $($Attr.SchemaName) failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }
}

function Add-OptionValue {
    param([string]$EntityLogical, [string]$AttributeLogical, [int]$Value, [string]$LabelText)
    $body = @{
        EntityLogicalName    = $EntityLogical
        AttributeLogicalName = $AttributeLogical
        Value                = $Value
        Label                = (Label $LabelText)
    }
    try {
        Invoke-DV -Method POST -Uri "/api/data/v9.2/InsertOptionValue" -Body $body
        Write-Host "  + option $LabelText ($Value) on $EntityLogical.$AttributeLogical" -ForegroundColor Cyan
        Start-Sleep -Milliseconds 500
    } catch {
        $msg = ""
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
        else { $msg = $_.Exception.Message }
        if ($msg -match "duplicate" -or $msg -match "already" -or $msg -match "0x80048408" -or $msg -match "0x80044310" -or $msg -match "another picklist or status option for this optionSet already exists") {
            Write-Host "  = option $LabelText (already present, skipped)" -ForegroundColor DarkGray
        } else {
            Write-Host "  ! option $LabelText failed: $msg" -ForegroundColor Red
            throw
        }
    }
}

function New-Lookup {
    param([string]$SchemaName, [string]$DisplayLabel, [string]$ReferencingEntity, [string]$ReferencedEntity)
    $body = @{
        "@odata.type"        = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
        SchemaName           = $SchemaName
        ReferencingEntity    = $ReferencingEntity
        ReferencedEntity     = $ReferencedEntity
        CascadeConfiguration = @{
            Assign = "NoCascade"; Delete = "RemoveLink"; Merge = "NoCascade"
            Reparent = "NoCascade"; Share = "NoCascade"; Unshare = "NoCascade"; RollupView = "NoCascade"
        }
        Lookup = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
            SchemaName    = $SchemaName
            DisplayName   = (Label $DisplayLabel)
            Description   = (Label "$DisplayLabel lookup")
            RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
        }
    }
    try {
        Invoke-DV -Method POST -Uri "/api/data/v9.2/RelationshipDefinitions" -Body $body
        Write-Host "  + lookup $SchemaName ($ReferencingEntity -> $ReferencedEntity)" -ForegroundColor Cyan
        Start-Sleep -Seconds 2
    } catch {
        if (Is-AlreadyExistsError $_) {
            Write-Host "  = lookup $SchemaName (already exists, skipped)" -ForegroundColor DarkGray
        } else {
            Write-Host "  ! lookup $SchemaName failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }
}

function New-Table {
    param([string]$SchemaName, [string]$DisplayLabel, [string]$PluralLabel, [array]$Columns, [string]$PrimaryCol, [string]$EntitySetName = $null)
    $primary = @{
        "@odata.type"  = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        SchemaName     = $PrimaryCol
        DisplayName    = (Label "Name")
        Description    = (Label "Primary name column")
        RequiredLevel  = @{ Value = "ApplicationRequired"; CanBeChanged = $true }
        MaxLength      = 200
        IsPrimaryName  = $true
    }
    $attrs = @($primary) + $Columns
    $body = @{
        "@odata.type"         = "Microsoft.Dynamics.CRM.EntityMetadata"
        SchemaName            = $SchemaName
        DisplayName           = (Label $DisplayLabel)
        DisplayCollectionName = (Label $PluralLabel)
        Description           = (Label $DisplayLabel)
        HasActivities         = $false
        HasNotes              = $false
        OwnershipType         = "UserOwned"
        IsActivity            = $false
        Attributes            = $attrs
    }
    if ($EntitySetName) { $body.EntitySetName = $EntitySetName }
    try {
        Invoke-DV -Method POST -Uri "/api/data/v9.2/EntityDefinitions" -Body $body
        Write-Host "  + table $SchemaName" -ForegroundColor Cyan
        Start-Sleep -Seconds 3
    } catch {
        if (Is-AlreadyExistsError $_) {
            Write-Host "  = table $SchemaName (already exists, skipped)" -ForegroundColor DarkGray
        } else {
            Write-Host "  ! table $SchemaName failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }
}

# =====================================================================
# STEP 1 - Add new columns to existing cr6cd_dix_cancellation table
# =====================================================================
Write-Host "`n=== STEP 1: Expand cr6cd_dix_cancellation ===" -ForegroundColor Magenta

$cancelTypes = @(
    "Vendor Only", "Driver Only", "Unit Only", "Vendor/Driver/Unit",
    "Vendor/Driver", "Vendor/Unit", "Driver/Unit", "Trailer Only",
    "SUB Unit", "Rental Only"
)
$statusValues = @(
    "Not Started", "In Progress", "Awaiting Returns", "All Items Received",
    "Items Not Received", "Forfeit", "Transferred", "Reactivated NTL", "Released"
)
$cancelReasons = @(
    "Resigned - Other", "Resigned - Found Another Job", "Resigned - Truck Down",
    "Resigned - Sick or Injury", "Resigned - Personal Issue", "Resigned - Retiring",
    "Termination - Other", "Termination - No Contact",
    "Termination - Medically Disqualified", "Termination - Safety Violations"
)

Add-Column "cr6cd_dix_cancellation" (ChoiceCol  "cr6cd_dix_canceltype"        "Cancellation Type"      $cancelTypes)
Add-Column "cr6cd_dix_cancellation" (ChoiceCol  "cr6cd_dix_status"            "Cancellation Status"    $statusValues)
Add-Column "cr6cd_dix_cancellation" (ChoiceCol  "cr6cd_dix_cancelreason"      "Cancel Reason"          $cancelReasons)
Add-Column "cr6cd_dix_cancellation" (MemoCol    "cr6cd_dix_reasondetails"     "Reason Details"         2000)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_unitnumber"        "Unit Number"            50)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_vendorcode"        "Vendor Code"            100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_vendorname"        "Vendor Name"            200)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_drivercode"        "Driver Code"            100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_drivername"        "Driver Name"            200)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_driverphone"       "Driver Phone"           30)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_trailercode"       "Trailer Code"           100)
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_startdate"         "Start Date")
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_canceldate"        "Cancel Date")
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_duedate"           "CXL Due Date")
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_allitemsrcvddate"  "All Items Received Date")
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_lastitemreceived"  "Last Item Received")
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_submittedby"       "Submitted By"           200)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_assignee"          "Assignee"               200)
Add-Column "cr6cd_dix_cancellation" (BoolCol    "cr6cd_dix_requestreturnlabel" "Request Return Label")
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_returnlabelurl"    "Return Label URL"       500)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_rltrackingnumber"  "Return Label Tracking"  100)
Add-Column "cr6cd_dix_cancellation" (BoolCol    "cr6cd_dix_forfeit"           "Forfeit Deposits")
Add-Column "cr6cd_dix_cancellation" (CurrencyCol "cr6cd_dix_elddeposit"       "ELD Deposit")
Add-Column "cr6cd_dix_cancellation" (CurrencyCol "cr6cd_dix_dashcamdeposit"   "DashCam Deposit")
Add-Column "cr6cd_dix_cancellation" (CurrencyCol "cr6cd_dix_pdideposit"       "PDI Deposit")

# Conditional intake fields (driven by equipment chip selections in the wizard)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_transferredtounit" "Items Transferred To Unit"  100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_prepassnumber"     "PrePass Number"             100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_rfidnumber"        "RFID Number"                100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_platenumber"       "Plate Number"               100)
Add-Column "cr6cd_dix_cancellation" (StringCol  "cr6cd_dix_fleetnumber"       "Fleet Number"               50)
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_logsfromdate"      "Logs From Date")
Add-Column "cr6cd_dix_cancellation" (DateCol    "cr6cd_dix_logstodate"        "Logs To Date")
Add-Column "cr6cd_dix_cancellation" (BoolCol    "cr6cd_dix_bypassagentaddress" "Bypass Agent Address")

# =====================================================================
# STEP 2 - Create cr6cd_dixcxlequipment (new table, new naming convention)
# =====================================================================
Write-Host "`n=== STEP 2: Create cr6cd_dixcxlequipment ===" -ForegroundColor Magenta

$lifecycleStates = @(
    "Need", "Returned", "Not Received", "Transferred",
    "Damaged", "Forfeit", "Under Review", "No Longer Needed", "N/A"
)

New-Table -SchemaName "cr6cd_dixcxlequipment" `
    -DisplayLabel "DIX Cancellation Equipment" `
    -PluralLabel "DIX Cancellation Equipment" `
    -PrimaryCol "cr6cd_name" `
    -EntitySetName "cr6cd_dixcxlequipments" `
    -Columns @(
        (StringCol "cr6cd_equipmentkey"   "Equipment Key"     50  "ApplicationRequired")
        (StringCol "cr6cd_displayname"    "Display Name"      100 "ApplicationRequired")
        (ChoiceCol "cr6cd_lifecyclestate" "Lifecycle State"   $lifecycleStates)
        (DateCol   "cr6cd_returneddate"   "Returned Date")
        (MemoCol   "cr6cd_notes"          "Notes" 1000)
    )

# Qualifier-flag bools, added independently so the script remains idempotent.
Add-Column "cr6cd_dixcxlequipment" (BoolCol "cr6cd_istransferred"  "Is Transferred")
Add-Column "cr6cd_dixcxlequipment" (BoolCol "cr6cd_isreactivated"  "Is Reactivated")

# =====================================================================
# STEP 3 - Lookups
# =====================================================================
Write-Host "`n=== STEP 3: Lookups ===" -ForegroundColor Magenta
Start-Sleep -Seconds 3

# Cancellation -> Agents (terminal)
New-Lookup -SchemaName "cr6cd_dix_cancagent" -DisplayLabel "Terminal Agent" `
    -ReferencingEntity "cr6cd_dix_cancellation" -ReferencedEntity "cr6cd_agents"

# Equipment -> Cancellation
New-Lookup -SchemaName "cr6cd_equipmentcancellation" -DisplayLabel "Cancellation" `
    -ReferencingEntity "cr6cd_dixcxlequipment" -ReferencedEntity "cr6cd_dix_cancellation"

# =====================================================================
# STEP 4 - Add Reactivated lifecycle option (idempotent)
# =====================================================================
Write-Host "`n=== STEP 4: Add Reactivated lifecycle state ===" -ForegroundColor Magenta
Add-OptionValue "cr6cd_dixcxlequipment" "cr6cd_lifecyclestate" 100000009 "Reactivated"

# =====================================================================
# STEP 5 - Notes table (cr6cd_dixcxlnote)
# =====================================================================
Write-Host "`n=== STEP 5: Create cr6cd_dixcxlnote ===" -ForegroundColor Magenta

New-Table -SchemaName "cr6cd_dixcxlnote" `
    -DisplayLabel "DIX Cancellation Note" `
    -PluralLabel "DIX Cancellation Notes" `
    -PrimaryCol "cr6cd_name" `
    -EntitySetName "cr6cd_dixcxlnotes" `
    -Columns @(
        (MemoCol   "cr6cd_body"     "Body" 4000)
        (MemoCol   "cr6cd_likedby"  "Liked By (JSON)" 4000)
    )

Start-Sleep -Seconds 3

# Note -> Cancellation
New-Lookup -SchemaName "cr6cd_notecancellation" -DisplayLabel "Cancellation" `
    -ReferencingEntity "cr6cd_dixcxlnote" -ReferencedEntity "cr6cd_dix_cancellation"

# Note -> Parent Note (self-reference for replies)
New-Lookup -SchemaName "cr6cd_parentnote" -DisplayLabel "Parent Note" `
    -ReferencingEntity "cr6cd_dixcxlnote" -ReferencedEntity "cr6cd_dixcxlnote"

Write-Host "`nDone." -ForegroundColor Green
Write-Host "Auth cached at $cacheFile - future scripts will reuse it." -ForegroundColor DarkGray
