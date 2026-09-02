# Zawsze in Love — Laravel API

This backend is the private persistence layer for the two-person Zawsze in Love memory site.

## What it stores

- exactly two user accounts (seeded from `.env`)
- one shared space
- photo and video metadata in the database
- private photo/video files under `storage/app/private`
- per-memory comments
- actual memory dates for sorting

There is intentionally no public registration route.

## Local setup

```powershell
cd backend
Copy-Item .env.example .env
New-Item -ItemType File -Path .\database\database.sqlite -Force
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Before `db:seed`, edit `backend/.env` and set both user emails/passwords.

Frontend API URL for local development:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/memories?type=image|video&sort=newest|oldest`
- `POST /api/memories/bulk`
- `PATCH /api/memories/{id}`
- `DELETE /api/memories/{id}`
- `POST /api/memories/{id}/comments`
- `DELETE /api/memories/{id}/comments/{comment}`

Uploaded media is never exposed as a public storage path. The API returns short-lived signed media URLs.
