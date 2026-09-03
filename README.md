# Zawsze in Love

A private two-person memory website built with React + Vite and a Laravel backend. Zawsze is designed as a shared archive for two authorized users, with memories, notes, timeline entries, favorites, comments, private media, and couple settings.

## Architecture

### Local development

```text
React + Vite
    ↓
Laravel API
    ↓
SQLite + local private media
```

### Production / cross-device deployment

```text
React + Vite on Cloudflare Pages
            ↓
Laravel API on a PHP 8.3 server
            ↓
      MySQL + private Cloudflare R2
```

The production architecture is the important part for cross-device use: both users and every authorized device connect to the same database and private media bucket. Upload once, then view the same memory from another laptop, phone, or tablet without re-uploading it.

GitHub stores source code only. Real passwords, `.env` files, database backups, and private photos/videos must never be committed.

## Current application

Zawsze includes:

- private login for the two authorized users;
- shared Home dashboard;
- Gallery with photo and video uploads;
- albums, favorites, dates, locations, locking, comments, edit and delete controls;
- optimized previews and cursor pagination;
- Love Notes;
- Timeline with image attachments;
- Favorites and search;
- notifications;
- account, avatar, couple, PIN, album, and backup settings;
- private signed media routes;
- local development storage plus S3-compatible production media support;
- Cloudflare R2-ready private object storage;
- MySQL-ready production database configuration.

## Run locally in VS Code

Frontend:

```bash
npm ci
npm run dev
```

Backend:

```bash
cd backend
composer install
php artisan migrate --seed
php artisan serve
```

On the Windows development laptop that uses the standalone PHP 8.3 installation, Artisan can be run explicitly with that PHP executable.

Frontend development URL is normally:

```text
http://localhost:5173
```

Backend development URL is normally:

```text
http://localhost:8000
```

## API environment

Local frontend:

```env
VITE_API_URL=http://localhost:8000/api
```

Production frontend:

```env
VITE_API_URL=https://api.example.com/api
```

The frontend request layer is centralized in:

```text
src/lib/api.js
```

## Private media storage

Local development uses the `media` disk backed by:

```text
backend/storage/app/private
```

Production can point the same logical `media` disk to Cloudflare R2 using Laravel's S3-compatible filesystem driver. Gallery originals, Gallery previews, Timeline images, and avatars use the configured media disk.

After configuring production storage, verify it with:

```bash
php artisan zawsze:storage-check
```

## Deployment

The complete cross-device deployment guide is:

```text
docs/DEPLOYMENT.md
```

It covers:

- Cloudflare R2 private media storage;
- central MySQL database configuration;
- Laravel production environment values;
- Cloudflare Pages frontend configuration;
- storage health checks;
- safe migration and backup guidance.

Safe templates are provided in:

```text
.env.production.example
backend/.env.production.example
```

Never put real credentials into those tracked example files.

## GitHub workflow

Repository:

```text
ayencha1412-ux/Zawsze-In-Love
```

Receive merged GitHub changes in the local VS Code copy:

```bash
git pull origin main
```

Send local source-code changes back to GitHub:

```bash
git add .
git commit -m "Describe the change"
git push
```

Private memories and secrets stay outside Git.
