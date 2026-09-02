$ErrorActionPreference = "Stop"

$Root = "C:\Users\admin\Desktop\Zawsze\full-stack-zawsze-web"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $env:TEMP "zawsze-safe-backup-$Stamp"

Write-Host ""
Write-Host "Zawsze In Love - Safe GitHub to VS Code Updater" -ForegroundColor Magenta
Write-Host "Ayen Chavez + Jonalyn Balmores" -ForegroundColor DarkMagenta
Write-Host ""

if (-not (Test-Path $Root)) { throw "Project folder not found: $Root" }
if (-not (Test-Path (Join-Path $Root ".git"))) { throw "Not a Git repository: $Root" }

# Make PHP and Composer available even if VS Code has an old PATH session.
$extraPaths = @()
if (Test-Path "C:\php83") { $extraPaths += "C:\php83" }
if (Test-Path "C:\ProgramData\ComposerSetup\bin") { $extraPaths += "C:\ProgramData\ComposerSetup\bin" }
if ($extraPaths.Count -gt 0) { $env:Path = ($extraPaths -join ";") + ";" + $env:Path }

if (Get-Command php -ErrorAction SilentlyContinue) { $Php = "php" }
elseif (Test-Path "C:\php83\php.exe") { $Php = "C:\php83\php.exe" }
else { throw "PHP not found. Expected C:\php83\php.exe" }

if (Get-Command composer -ErrorAction SilentlyContinue) { $Composer = "composer" }
elseif (Test-Path "C:\ProgramData\ComposerSetup\bin\composer.bat") { $Composer = "C:\ProgramData\ComposerSetup\bin\composer.bat" }
else { throw "Composer not found." }

function Invoke-Php {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args)
    & $Php @Args
    if ($LASTEXITCODE -ne 0) { throw "PHP command failed: $($Args -join ' ')" }
}

function Invoke-Composer {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args)
    & $Composer @Args
    if ($LASTEXITCODE -ne 0) { throw "Composer command failed: $($Args -join ' ')" }
}

function Copy-IfExists {
    param([string]$Source, [string]$Destination, [switch]$Recurse)
    if (Test-Path $Source) {
        $parent = Split-Path $Destination -Parent
        if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        if ($Recurse) { Copy-Item $Source $Destination -Recurse -Force }
        else { Copy-Item $Source $Destination -Force }
    }
}

New-Item -ItemType Directory -Path $Backup -Force | Out-Null
Copy-IfExists "$Root\backend\.env" "$Backup\backend\.env"
Copy-IfExists "$Root\backend\database\database.sqlite" "$Backup\backend\database\database.sqlite"
Copy-IfExists "$Root\backend\storage\app\private" "$Backup\backend\storage\app\private" -Recurse

Write-Host "Private backend data backed up to:" -ForegroundColor Green
Write-Host "  $Backup"

Set-Location $Root

# The first Laravel backend was installed manually and may still be untracked.
# Move it safely before Git checks out the tracked backend from main.
$trackedBackend = @(git ls-files backend)
if ((Test-Path "$Root\backend") -and $trackedBackend.Count -eq 0) {
    Move-Item "$Root\backend" (Join-Path $Backup "backend-old-code") -Force
    Write-Host "Moved the old untracked backend aside safely." -ForegroundColor Yellow
}

# Preserve any other local work rather than deleting it.
$status = @(git status --porcelain)
if ($status.Count -gt 0) {
    git stash push -u -m "Zawsze updater backup $Stamp"
    if ($LASTEXITCODE -ne 0) { throw "Could not stash local changes." }
    Write-Host "Other local edits were saved in Git stash." -ForegroundColor Yellow
}

Write-Host "Fetching latest GitHub main..." -ForegroundColor Cyan
git fetch origin
if ($LASTEXITCODE -ne 0) { throw "git fetch failed." }

git checkout main
if ($LASTEXITCODE -ne 0) { throw "Could not switch to main." }

git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw "Could not synchronize with origin/main." }

Write-Host "Source code now matches GitHub main." -ForegroundColor Green

# Restore local-only secrets, database, and private uploads.
New-Item -ItemType Directory -Path "$Root\backend\database" -Force | Out-Null
New-Item -ItemType Directory -Path "$Root\backend\storage\app\private" -Force | Out-Null
Copy-IfExists "$Backup\backend\.env" "$Root\backend\.env"
Copy-IfExists "$Backup\backend\database\database.sqlite" "$Root\backend\database\database.sqlite"
if (Test-Path "$Backup\backend\storage\app\private") {
    Copy-Item "$Backup\backend\storage\app\private\*" "$Root\backend\storage\app\private" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Updating frontend packages..." -ForegroundColor Cyan
Set-Location $Root
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

Write-Host "Updating Laravel packages..." -ForegroundColor Cyan
Set-Location "$Root\backend"
Invoke-Composer install --no-interaction

if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
if (-not (Test-Path "database\database.sqlite")) { New-Item "database\database.sqlite" -ItemType File -Force | Out-Null }

$envText = Get-Content ".env" -Raw
if ($envText -notmatch '(?m)^APP_KEY=.+$') { Invoke-Php artisan key:generate --force }

Invoke-Php artisan config:clear
Invoke-Php artisan migrate --force

Write-Host ""
Write-Host "Configure the two private Zawsze accounts." -ForegroundColor Cyan
Write-Host "Enter the Ayen and Jonalyn emails/passwords you chose. Password typing is hidden." -ForegroundColor DarkGray
PowerShell.exe -ExecutionPolicy Bypass -File ".\configure-couple.ps1"
if ($LASTEXITCODE -ne 0) { throw "Account configuration failed." }

Write-Host "Validating backend routes..." -ForegroundColor Cyan
Invoke-Php artisan route:list | Out-Null

Write-Host "Validating frontend build..." -ForegroundColor Cyan
Set-Location $Root
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed." }

Write-Host ""
Write-Host "SUCCESS - GitHub and local VS Code are synchronized." -ForegroundColor Green
Write-Host "Current commit: $((git rev-parse --short HEAD).Trim())" -ForegroundColor Green
Write-Host "Backup kept at: $Backup" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Run TWO VS Code terminals:" -ForegroundColor Cyan
Write-Host "Terminal 1:"
Write-Host "  cd `"$Root\backend`""
Write-Host "  & `"C:\php83\php.exe`" artisan serve"
Write-Host ""
Write-Host "Terminal 2:"
Write-Host "  cd `"$Root`""
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://127.0.0.1:8000"
