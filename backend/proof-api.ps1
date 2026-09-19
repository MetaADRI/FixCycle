# proof.ps1 - endpoint-only Neon persistence proof. Pure ASCII, vanilla PowerShell.
# Uses the already-running backend on :4001 (boot log: "Neon persistence ENABLED").
# 1) register a fresh phone+password  -> expect 200 + access_token
# 2) login with CORRECT phone+password -> expect 200 + access_token
# 3) login with WRONG password -> expect NO access_token (failure envelope result:0)
# 4) login with UNREGISTERED phone -> expect NO access_token (failure envelope result:0)
$ErrorActionPreference = "Stop"
$base = "http://localhost:4001/api"

function Post-Json {
  param([string]$Route, [hashtable]$Body)
  $json = $Body | ConvertTo-Json -Compress
  $resp = Invoke-WebRequest -Uri ($base + $Route) -Method Post -ContentType "application/json" -Body $json
  $parsed = $null
  try { $parsed = $resp.Content | ConvertFrom-Json } catch {}
  return @{ Status = [int]$resp.StatusCode; Data = $parsed }
}

function Get-Token {
  param($Data)
  if (-not $Data) { return $null }
  if ($Data.data -and $Data.data.access_token) { return $Data.data.access_token }
  if ($Data.data -and $Data.data.data -and $Data.data.data.access_token) { return $Data.data.data.access_token }
  if ($Data.access_token) { return $Data.access_token }
  return $null
}

$pwd = "#Proof" + (Get-Random -Minimum 1000000 -Maximum 9999999)
$phone = "2609" + (Get-Random -Minimum 1000000000 -Maximum 1999999999)

# 1) register
$r1 = Post-Json "/user/normal-reg" @{ phone = $phone; password = $pwd; first_name = "Neon"; last_name = "Proof"; requested_from = "web" }
$t1 = Get-Token $r1.Data
Write-Output ("1) register: HTTP {0} + access_token: {1}" -f $r1.Status, [bool]$t1)

# 2) login correct
$r2 = Post-Json "/user/on-board" @{ phone = $phone; password = $pwd; requested_from = "web" }
$t2 = Get-Token $r2.Data
Write-Output ("2) login CORRECT phone+password: HTTP {0} + access_token: {1}" -f $r2.Status, [bool]$t2)

# 3) login wrong password
$r3 = Post-Json "/user/on-board" @{ phone = $phone; password = "WrongPass999"; requested_from = "web" }
$t3 = Get-Token $r3.Data
Write-Output ("3) login WRONG password: HTTP {0} + got token: {1} (expect False = rejected)" -f $r3.Status, [bool]$t3)

# 4) login unregistered phone
$unreg = "2609" + (Get-Random -Minimum 1000000000 -Maximum 1999999999)
$r4 = Post-Json "/user/on-board" @{ phone = $unreg; password = $pwd; requested_from = "web" }
$t4 = Get-Token $r4.Data
Write-Output ("4) login UNREGISTERED phone: HTTP {0} + got token: {1} (expect False = rejected)" -f $r4.Status, [bool]$t4)

$ok = ([bool]$t1 -and [bool]$t2 -and (-not $t3) -and (-not $t4))
Write-Output ""
if ($ok) { Write-Output "RESULT: PASS - account persisted + login validated" } else { Write-Output "RESULT: FAIL" }
exit $(if ($ok) { 0 } else { 1 })
