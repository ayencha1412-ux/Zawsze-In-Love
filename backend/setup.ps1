$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path .env)) { Copy-Item .env.example .env }
    if (-not (Test-Path database\database.sqlite)) { New-Item database\database.sqlite -ItemType File -Force | Out-Null }
    composer install
    if ((Get-Content .env -Raw) -notmatch '(?m)^APP_KEY=base64:') { php artisan key:generate }
    php artisan migrate --force
    Write-Host "Zawsze backend is ready." -ForegroundColor Green
    Write-Host "Run .\configure-couple.ps1 once to configure Ayen and Jonalyn, then php artisan serve."
} finally { Pop-Location }
