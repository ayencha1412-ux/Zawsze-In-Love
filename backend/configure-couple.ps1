$ErrorActionPreference = "Stop"

function Set-EnvValue {
    param([string]$Key, [string]$Value)
    $envPath = Join-Path $PSScriptRoot ".env"
    if (-not (Test-Path $envPath)) { Copy-Item (Join-Path $PSScriptRoot ".env.example") $envPath }
    $escaped = $Value.Replace('"', '\"')
    $line = "$Key=`"$escaped`""
    $content = Get-Content $envPath -Raw
    $pattern = "(?m)^" + [regex]::Escape($Key) + "=.*$"
    if ([regex]::IsMatch($content, $pattern)) { $content = [regex]::Replace($content, $pattern, $line) }
    else { $content = $content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine }
    Set-Content -Path $envPath -Value $content -Encoding UTF8
}

Write-Host "Configure the two private Zawsze accounts." -ForegroundColor Cyan
Write-Host "These values stay only in backend/.env and are not committed to GitHub." -ForegroundColor DarkGray

$userOneEmail = Read-Host "Ayen Chavez email"
$userOnePassword = Read-Host "Ayen Chavez password" -AsSecureString
$userTwoEmail = Read-Host "Jonalyn Balmores email"
$userTwoPassword = Read-Host "Jonalyn Balmores password" -AsSecureString

function To-PlainText([Security.SecureString]$Secure) {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Set-EnvValue "ZAWSZE_USER_ONE_NAME" "Ayen Chavez"
Set-EnvValue "ZAWSZE_USER_ONE_EMAIL" $userOneEmail
Set-EnvValue "ZAWSZE_USER_ONE_PASSWORD" (To-PlainText $userOnePassword)
Set-EnvValue "ZAWSZE_USER_TWO_NAME" "Jonalyn Balmores"
Set-EnvValue "ZAWSZE_USER_TWO_EMAIL" $userTwoEmail
Set-EnvValue "ZAWSZE_USER_TWO_PASSWORD" (To-PlainText $userTwoPassword)

Push-Location $PSScriptRoot
try {
    php artisan config:clear
    php artisan migrate --force
    php artisan db:seed --force
} finally { Pop-Location }

Write-Host "Zawsze couple accounts are configured." -ForegroundColor Green
