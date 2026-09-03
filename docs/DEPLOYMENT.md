# Zawsze in Love — Shared Deployment

This deployment removes the device-local storage limitation. In production, every authorized device talks to the same Laravel API, MySQL database, and private media bucket.

```text
React / Vite (Cloudflare Pages)
            |
            v
Laravel API (Oracle Cloud VM + Nginx + PHP 8.3)
            |
      +-----+------------------+
      |                        |
      v                        v
MySQL database          Cloudflare R2
metadata/accounts       photos/videos/previews
```

## Why this fixes cross-device memories

The local development setup uses SQLite and local files under `backend/storage/app/private`. Those files belong only to that computer. The production setup instead uses one central MySQL database and one private Cloudflare R2 bucket. A memory uploaded from one device is therefore available to every authorized device after login.

GitHub remains source-code only. Never commit the production `.env`, database dumps, R2 access keys, real passwords, or private media.

## 1. Cloudflare R2

Create a private bucket such as `zawsze-private-media`, then create S3-compatible R2 credentials with read/write access to that bucket.

Configure the Laravel server with:

```env
ZAWSZE_MEDIA_DISK=media
MEDIA_DISK_DRIVER=s3
MEDIA_ACCESS_KEY_ID=...
MEDIA_SECRET_ACCESS_KEY=...
MEDIA_REGION=auto
MEDIA_BUCKET=zawsze-private-media
MEDIA_ENDPOINT=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
MEDIA_URL=
MEDIA_PATH_STYLE=false
```

The bucket should remain private. Zawsze serves media through signed application routes and Laravel temporary S3 URLs instead of exposing a public bucket.

After configuring the credentials, verify storage before accepting uploads:

```bash
php artisan config:clear
php artisan zawsze:storage-check
```

Expected result:

```text
Media storage [media] is writable, readable, and deletable.
```

## 2. MySQL

Use MySQL for the deployed application so accounts, memory metadata, albums, notes, comments, timeline entries, favorites, and settings are shared by every device.

Example production values:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=zawsze
DB_USERNAME=zawsze
DB_PASSWORD=...
```

After creating the database and user:

```bash
php artisan migrate --force
php artisan db:seed --force
```

Do not repeatedly run `migrate:fresh` on production because it deletes existing data.

## 3. Laravel server

The production server requires PHP 8.3+, Composer, Nginx, and the PHP extensions required by Laravel and the application.

From the backend directory:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan zawsze:storage-check
```

Use `backend/.env.production.example` only as a template. Copy its values into the server's private `.env` and replace every placeholder. Never commit the real `.env`.

The API should be served over HTTPS, for example:

```text
https://api.example.com
```

Set:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://example.pages.dev
```

## 4. React frontend / Cloudflare Pages

Build the Vite frontend with the production Laravel API URL:

```env
VITE_API_URL=https://api.example.com/api
```

The same value can be configured as a Cloudflare Pages environment variable instead of committing a `.env.production` file.

Build command:

```bash
npm ci
npm run build
```

Publish directory:

```text
dist
```

## 5. Upload behavior after deployment

When an authorized user uploads a memory:

1. The browser sends the media to the Laravel API.
2. Laravel stores the original and preview in the configured `media` disk.
3. In production the `media` disk points to the private R2 bucket.
4. Laravel stores the metadata in the central MySQL database.
5. Another authorized device loads the same metadata and signed media URLs after login.

No device-to-device copying or re-upload is required.

Timeline images and avatars also use the configured `media` disk so they follow the same shared-storage model.

## 6. Existing memories from an old laptop

The new deployment prevents future device-local loss, but it cannot reconstruct files that never reached the server. If the old laptop becomes available later, migrate its `database.sqlite` metadata and `storage/app/private` media into the production MySQL database and R2 bucket before deleting the old copy.

## 7. Backups

Treat MySQL and R2 as the permanent source of truth, but still keep independent backups. At minimum, schedule regular MySQL dumps and periodically verify that exported Zawsze archives can be created. Keep backups private and separate from the public GitHub repository.
