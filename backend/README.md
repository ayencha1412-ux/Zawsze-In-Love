# Zawsze Laravel Backend

Private API for the shared Zawsze in Love archive used only by Ayen Chavez and Jonalyn Balmores.

## Local setup

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
New-Item database\database.sqlite -ItemType File -Force
php artisan migrate
powershell.exe -ExecutionPolicy Bypass -File .\configure-couple.ps1
php artisan serve
```

Real account emails and passwords belong only in `.env`; never commit them. Uploaded media is stored under `storage/app/private` and is also excluded from Git.
