$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$verifier = Join-Path $repoRoot 'tools\verify-public-repo.ps1'
if (-not (Test-Path -LiteralPath $verifier)) {
    throw 'Verifier missing: tools/verify-public-repo.ps1'
}

function New-TestRepository([string]$name) {
    $root = Join-Path ([IO.Path]::GetTempPath()) ("qrayti-public-test-$name-$([guid]::NewGuid().ToString('N'))")
    New-Item -ItemType Directory -Path (Join-Path $root 'src') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $root 'LICENSE') -Value 'Apache License 2.0' -Encoding utf8
    Set-Content -LiteralPath (Join-Path $root 'BRAND.md') -Value 'Qrayti brand rules' -Encoding utf8
    Set-Content -LiteralPath (Join-Path $root 'SECURITY.md') -Value 'Private reporting' -Encoding utf8
    Set-Content -LiteralPath (Join-Path $root '.gitignore') -Value '*.apk' -Encoding utf8
    Set-Content -LiteralPath (Join-Path $root 'src\Main.kt') -Value 'fun main() = println("safe")' -Encoding utf8
    return $root
}

function Invoke-Check([string]$root) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifier -Root $root *> $null
    return $LASTEXITCODE
}

$failures = [Collections.Generic.List[string]]::new()
$roots = [Collections.Generic.List[string]]::new()
try {
    $safe = New-TestRepository 'safe'; $roots.Add($safe)
    if ((Invoke-Check $safe) -ne 0) { $failures.Add('safe repository was rejected') }

    $envCase = New-TestRepository 'env'; $roots.Add($envCase)
    Set-Content -LiteralPath (Join-Path $envCase '.env') -Value 'EXAMPLE=value' -Encoding utf8
    if ((Invoke-Check $envCase) -eq 0) { $failures.Add('.env was accepted') }

    $binaryCase = New-TestRepository 'binary'; $roots.Add($binaryCase)
    Set-Content -LiteralPath (Join-Path $binaryCase 'release.apk') -Value 'binary' -Encoding utf8
    if ((Invoke-Check $binaryCase) -eq 0) { $failures.Add('APK was accepted') }

    $keyCase = New-TestRepository 'key'; $roots.Add($keyCase)
    $keyHeader = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t'))
    Set-Content -LiteralPath (Join-Path $keyCase 'src\key.txt') -Value $keyHeader -Encoding utf8
    if ((Invoke-Check $keyCase) -eq 0) { $failures.Add('private-key header was accepted') }

    $pathCase = New-TestRepository 'path'; $roots.Add($pathCase)
    $privatePath = 'C:' + '\' + 'Users' + '\' + 'student' + '\' + 'secret.txt'
    Set-Content -LiteralPath (Join-Path $pathCase 'src\config.txt') -Value $privatePath -Encoding utf8
    if ((Invoke-Check $pathCase) -eq 0) { $failures.Add('personal absolute path was accepted') }
}
finally {
    foreach ($root in $roots) { Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue }
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'PASS: public repository verifier rejects unsafe fixtures.'
