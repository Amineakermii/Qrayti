param(
    [string]$Root = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Stop'
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$violations = [Collections.Generic.List[string]]::new()

function Get-CompatibleRelativePath([string]$basePath, [string]$childPath) {
    $baseUri = [Uri]($basePath.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar)
    $childUri = [Uri]$childPath
    return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($childUri).ToString()).Replace('/', [IO.Path]::DirectorySeparatorChar)
}

function Add-Violation([string]$rule, [string]$path) {
    $relative = Get-CompatibleRelativePath $resolvedRoot $path
    $violations.Add("$rule :: $relative")
}

foreach ($required in @('LICENSE', 'BRAND.md', 'SECURITY.md', '.gitignore')) {
    $requiredPath = Join-Path $resolvedRoot $required
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        $violations.Add("REQUIRED_FILE :: $required")
    }
}

$files = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File -Force |
    Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' }

$forbiddenDirectory = '[\\/](website-backup-[^\\/]+|release|reports|node_modules|\.gradle|\.wrangler|\.qrayti-build-tools|programmer-freelancer-app[^\\/]*|freelance-kit-ar)([\\/]|$)'
$forbiddenExtension = '\.(apk|aab|jks|keystore|p12|pfx|pem|key|exe|dll|zip|rar|7z|pdf|doc|docx|ppt|pptx|xls|xlsx)$'
$textExtension = '\.(kt|kts|java|xml|json|jsonc|js|mjs|cjs|css|html|md|txt|toml|properties|gradle|ps1|bat|yml|yaml|svg|webmanifest)$'
$privateKeyPattern = '-----BEGIN ' + '(RSA |EC |OPENSSH )?' + 'PRIVATE KEY-----'
$privatePathPattern = '[A-Za-z]:' + '\\Users\\' + '[^\\\s]+' + '\\'
$cloudflareTokenPattern = '(?i)(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)' + '\s*=\s*' + '[^\s]{20,}'
$assignedSecretPattern = '(?i)(password|secret|access_token)' + '\s*[:=]\s*' + '["'']' + '[^"'']{12,}'

foreach ($file in $files) {
    $relative = Get-CompatibleRelativePath $resolvedRoot $file.FullName
    if ($relative -match '(^|[\\/])\.env($|\.)' -or $relative -match '(^|[\\/])\.dev\.vars($|\.)') {
        Add-Violation 'ENV_FILE' $file.FullName
    }
    if ($file.FullName -match $forbiddenDirectory) { Add-Violation 'FORBIDDEN_DIRECTORY' $file.FullName }
    if ($file.Name -match $forbiddenExtension) { Add-Violation 'FORBIDDEN_BINARY_OR_DOCUMENT' $file.FullName }
    if ($file.Length -gt 95MB) { Add-Violation 'FILE_TOO_LARGE' $file.FullName }

    if ($file.Name -match $textExtension -and $relative -notmatch '^tools[\\/]tests[\\/]') {
        $text = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -eq $text) { continue }
        if ($text -match $privateKeyPattern) { Add-Violation 'PRIVATE_KEY' $file.FullName }
        if ($text -match $privatePathPattern) { Add-Violation 'PERSONAL_PATH' $file.FullName }
        if ($text -match $cloudflareTokenPattern) { Add-Violation 'CLOUDFLARE_TOKEN' $file.FullName }
        if ($text -match $assignedSecretPattern) { Add-Violation 'ASSIGNED_SECRET' $file.FullName }
    }
}

if ($violations.Count) {
    Write-Output 'Public repository safety check failed:'
    $violations | Sort-Object -Unique | ForEach-Object { Write-Output "- $_" }
    exit 1
}

Write-Output "PASS: $($files.Count) files checked; no forbidden public content found."
exit 0
