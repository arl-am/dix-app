$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# =====================================================================
# Diagnostic: prints the current state of cr6cd_dixcxlnote relationships
# and attributes that are named or look like cr6cd_parentnote.
# Run against Dev to confirm whether the remediation actually landed.
# =====================================================================

$OrgUrl   = "https://org71748d11.crm.dynamics.com"
$clientId = "51f81489-12ee-4a9e-aaae-a2591f45987d"
$tenantId = "1ab993e6-5837-45e4-a231-6466807ddb34"
$scope    = "$OrgUrl/.default offline_access"

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
            -Body @{ grant_type = "refresh_token"; client_id = $clientId; refresh_token = $refreshToken; scope = $scope }
        Save-Cache $r.access_token $r.refresh_token $r.expires_in
        return $r.access_token
    } catch { return $null }
}

function Get-Token {
    if (Test-Path $cacheFile) {
        $cache = Get-Content $cacheFile -Raw | ConvertFrom-Json
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        if ($cache.expires_at -gt $now -and $cache.access_token) { return $cache.access_token }
        if ($cache.refresh_token) {
            $tok = Try-RefreshToken $cache.refresh_token
            if ($tok) { return $tok }
        }
    }
    $codeReq = Invoke-RestMethod -Method POST `
        -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/devicecode" `
        -Body @{ client_id = $clientId; scope = $scope }
    Write-Host $codeReq.message -ForegroundColor Yellow
    $token = $null; $waited = 0
    while (-not $token -and $waited -lt $codeReq.expires_in) {
        Start-Sleep -Seconds $codeReq.interval; $waited += $codeReq.interval
        try {
            $t = Invoke-RestMethod -Method POST `
                -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
                -Body @{ grant_type = "urn:ietf:params:oauth:grant-type:device_code"; client_id = $clientId; device_code = $codeReq.device_code }
            Save-Cache $t.access_token $t.refresh_token $t.expires_in
            $token = $t.access_token
        } catch {
            $e = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($e.error -eq "authorization_pending") { continue }
            throw
        }
    }
    if (-not $token) { throw "Auth timed out" }
    return $token
}

$token = Get-Token
$headers = @{
    "Authorization"    = "Bearer $token"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    "Accept"           = "application/json"
}

Write-Host "`n=== ATTRIBUTES on cr6cd_dixcxlnote (cr6cd_*) ===" -ForegroundColor Magenta
$attrUri = "$OrgUrl/api/data/v9.2/EntityDefinitions(LogicalName='cr6cd_dixcxlnote')/Attributes?`$select=LogicalName,SchemaName,AttributeType,MetadataId"
$attrs = Invoke-RestMethod -Method GET -Uri $attrUri -Headers $headers
$attrs.value | Where-Object { $_.LogicalName -like "cr6cd_*" } | Sort-Object LogicalName | ForEach-Object {
    $marker = if ($_.LogicalName -like "*parentnote*") { "  >>" } else { "    " }
    Write-Host "$marker $($_.LogicalName) [$($_.AttributeType)] schema=$($_.SchemaName)"
}

Write-Host "`n=== ONE-TO-MANY RELATIONSHIPS on cr6cd_dixcxlnote ===" -ForegroundColor Magenta
$relUri = "$OrgUrl/api/data/v9.2/EntityDefinitions(LogicalName='cr6cd_dixcxlnote')/OneToManyRelationships?`$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,MetadataId"
$rels = Invoke-RestMethod -Method GET -Uri $relUri -Headers $headers
$rels.value | Sort-Object SchemaName | ForEach-Object {
    $marker = if ($_.SchemaName -like "*parentnote*") { "  >>" } else { "    " }
    Write-Host "$marker $($_.SchemaName) ($($_.ReferencingEntity).$($_.ReferencingAttribute) -> $($_.ReferencedEntity))"
}

Write-Host "`n=== MANY-TO-ONE RELATIONSHIPS on cr6cd_dixcxlnote ===" -ForegroundColor Magenta
$mtoUri = "$OrgUrl/api/data/v9.2/EntityDefinitions(LogicalName='cr6cd_dixcxlnote')/ManyToOneRelationships?`$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity"
$mtos = Invoke-RestMethod -Method GET -Uri $mtoUri -Headers $headers
$mtos.value | Sort-Object SchemaName | ForEach-Object {
    $marker = if ($_.SchemaName -like "*parentnote*") { "  >>" } else { "    " }
    Write-Host "$marker $($_.SchemaName) ($($_.ReferencingEntity).$($_.ReferencingAttribute) -> $($_.ReferencedEntity))"
}

Write-Host "`n=== VERDICT ===" -ForegroundColor Magenta
$badRel = $rels.value | Where-Object { $_.SchemaName -eq "cr6cd_parentnote" }
$goodRel = $rels.value | Where-Object { $_.SchemaName -eq "cr6cd_dixcxlnote_parentnote" }
$col = $attrs.value | Where-Object { $_.LogicalName -eq "cr6cd_parentnote" }

if ($badRel) {
    Write-Host "  BAD: relationship 'cr6cd_parentnote' STILL EXISTS in Dev." -ForegroundColor Red
    Write-Host "       The remediation has not been applied successfully yet." -ForegroundColor Red
    Write-Host "       Run: pwsh scripts/fix-parentnote-relationship.ps1" -ForegroundColor Yellow
} elseif ($goodRel -and $col) {
    Write-Host "  GOOD: Dev has relationship 'cr6cd_dixcxlnote_parentnote' + column 'cr6cd_parentnote'." -ForegroundColor Green
    Write-Host "       If Prod still rejects, the exported solution is stale - bump the solution version and re-export." -ForegroundColor Yellow
} elseif (-not $col) {
    Write-Host "  PARTIAL: column 'cr6cd_parentnote' is missing. Run fix script to recreate it." -ForegroundColor Yellow
} else {
    Write-Host "  UNCLEAR: column exists but no parentnote relationship found." -ForegroundColor Yellow
}
