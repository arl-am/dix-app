param([switch]$Force)
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# =====================================================================
# Remediation: cr6cd_dixcxlnote.cr6cd_parentnote relationship/column conflict
#
# Problem: the Parent Note self-reference was created with the same schema
# name (cr6cd_parentnote) for both the relationship and the lookup column.
# Dev tolerates this but Prod's solution import validator rejects with:
#   "RelationshipName cr6cd_parentnote conflict with attribute name on
#    entity cr6cd_dixcxlnote. Please use unique name for relationship."
#
# Fix: delete the broken relationship + column, recreate with distinct names:
#   relationship -> cr6cd_dixcxlnote_parentnote
#   column       -> cr6cd_parentnote   (unchanged, so app code keeps working)
#
# Run this AGAINST DEV. It will:
#   1. Delete the existing relationship (and its lookup column)
#   2. Any data in cr6cd_parentnote (reply links) will be lost
#   3. Recreate the relationship + column with corrected names
#
# After this completes, re-export DIXApp from Dev and re-deploy to Prod.
# =====================================================================

$OrgUrl   = "https://org71748d11.crm.dynamics.com"
$clientId = "51f81489-12ee-4a9e-aaae-a2591f45987d"
$tenantId = "1ab993e6-5837-45e4-a231-6466807ddb34"
$scope    = "$OrgUrl/.default offline_access"
$solution = "DIXApp"

$cacheFile = Join-Path $PSScriptRoot ".auth-cache.json"

function Save-Cache($accessToken, $refreshToken, $expiresIn) {
    $cache = @{
        access_token  = $accessToken
        refresh_token = $refreshToken
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

    $codeReq = Invoke-RestMethod -Method POST `
        -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/devicecode" `
        -Body @{ client_id = $clientId; scope = $scope }
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

function Label { param([string]$Text) @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Text; LanguageCode = 1033 }) } }

# =====================================================================
# STEP 1 - Audit: count existing reply links so the user knows what's at stake
# =====================================================================
Write-Host "`n=== STEP 1: Auditing existing reply data ===" -ForegroundColor Magenta

$replyCount = 0
try {
    $countResp = Invoke-DV -Method GET -Uri "/api/data/v9.2/cr6cd_dixcxlnotes?`$select=cr6cd_dixcxlnoteid&`$filter=_cr6cd_parentnote_value ne null&`$top=5000"
    if ($countResp.value) { $replyCount = $countResp.value.Count }
    Write-Host "  Reply notes currently linked via cr6cd_parentnote: $replyCount" -ForegroundColor Yellow
} catch {
    Write-Host "  Could not query reply count (column may already be missing): $($_.Exception.Message)" -ForegroundColor DarkYellow
}

if ($replyCount -gt 0) {
    Write-Host "`n  WARNING: $replyCount reply note(s) will lose their parent link." -ForegroundColor Red
    Write-Host "  The note bodies are kept; only the threading parent is dropped." -ForegroundColor DarkYellow
}

if ($Force) {
    Write-Host "`n  -Force specified, proceeding without prompt" -ForegroundColor Yellow
} else {
    $confirmation = Read-Host "`nProceed with delete + recreate? (type YES to continue)"
    if ($confirmation -ne "YES") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# =====================================================================
# STEP 2 - Delete the broken self-referencing relationship
# =====================================================================
Write-Host "`n=== STEP 2: Deleting old relationship cr6cd_parentnote ===" -ForegroundColor Magenta

try {
    Invoke-DV -Method DELETE -Uri "/api/data/v9.2/RelationshipDefinitions(SchemaName='cr6cd_parentnote')"
    Write-Host "  - relationship cr6cd_parentnote deleted (lookup column removed too)" -ForegroundColor Cyan
    Start-Sleep -Seconds 3
} catch {
    $msg = ""
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    else { $msg = $_.Exception.Message }
    if ($msg -match "Could not find" -or $msg -match "does not exist" -or $msg -match "0x80044150") {
        Write-Host "  = relationship not found (already removed?), continuing" -ForegroundColor DarkGray
    } else {
        Write-Host "  ! delete failed: $msg" -ForegroundColor Red
        throw
    }
}

# =====================================================================
# STEP 3 - Recreate with distinct relationship + column names
# =====================================================================
Write-Host "`n=== STEP 3: Recreating with corrected names ===" -ForegroundColor Magenta

$body = @{
    "@odata.type"        = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
    SchemaName           = "cr6cd_dixcxlnote_parentnote"  # relationship name (distinct)
    ReferencingEntity    = "cr6cd_dixcxlnote"
    ReferencedEntity     = "cr6cd_dixcxlnote"
    CascadeConfiguration = @{
        Assign = "NoCascade"; Delete = "RemoveLink"; Merge = "NoCascade"
        Reparent = "NoCascade"; Share = "NoCascade"; Unshare = "NoCascade"; RollupView = "NoCascade"
    }
    Lookup = @{
        "@odata.type" = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
        SchemaName    = "cr6cd_parentnote"  # column name (unchanged, so app code keeps working)
        DisplayName   = (Label "Parent Note")
        Description   = (Label "Parent Note lookup")
        RequiredLevel = @{ Value = "None"; CanBeChanged = $true }
    }
}

try {
    Invoke-DV -Method POST -Uri "/api/data/v9.2/RelationshipDefinitions" -Body $body
    Write-Host "  + relationship cr6cd_dixcxlnote_parentnote created" -ForegroundColor Cyan
    Write-Host "  + lookup column cr6cd_parentnote created" -ForegroundColor Cyan
} catch {
    $msg = ""
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    else { $msg = $_.Exception.Message }
    Write-Host "  ! create failed: $msg" -ForegroundColor Red
    throw
}

Write-Host "`nDone." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. In make.powerapps.com, open the DIXApp solution and verify the Parent Note column on cr6cd_dixcxlnote." -ForegroundColor Yellow
Write-Host "  2. Publish all customizations (Solutions -> ... -> Publish all)." -ForegroundColor Yellow
Write-Host "  3. Re-export DIXApp and re-run the deployment to Prod." -ForegroundColor Yellow
