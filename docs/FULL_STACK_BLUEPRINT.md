# Zawsze in Love — Full Stack Blueprint

## Product goal

Zawsze in Love is a private shared memory website for exactly two people. Both people can sign in, upload photos and videos, comment on memories, browse a date-sorted archive, and see the same shared content from different devices.

The architecture follows the useful pattern from IntelliBridge: React/Vite on the frontend, one centralized API client, a Laravel REST API, protected authenticated routes, a relational database, environment-based API URLs, and separate local/production configuration. Zawsze is intentionally much smaller and does not reuse IntelliBridge business logic.

## Repository layout

Keep the current React/Vite app working at the repository root while the backend is introduced under `backend/`:

```text
Zawsze-In-Love/
├─ src/                     React frontend
├─ index.html
├─ package.json
├─ vite.config.js
├─ .env.example
├─ backend/                 Laravel API (next phase)
│  ├─ app/
│  ├─ database/
│  ├─ routes/api.php
│  ├─ storage/
│  └─ artisan
└─ docs/
   └─ FULL_STACK_BLUEPRINT.md
```

This avoids breaking the frontend that already runs locally.

## Authentication model

There is no public registration page.

The production app should contain one private shared space with exactly two authorized users. Accounts are created through a seeder/admin setup, then both users sign in normally. Laravel Sanctum bearer tokens can protect the API in the same general style as IntelliBridge.

Recommended protected middleware chain:

```text
auth:sanctum -> shared-space.member
```

Every memory/comment query must be scoped to the authenticated user's shared space. A user must never be able to request another space's media by guessing an ID.

## Core database tables

### users

Standard Laravel users plus display name/avatar fields.

### spaces

```text
id
name
created_at
updated_at
```

Production will normally have one space: `Zawsze in Love`.

### space_user

```text
space_id
user_id
joined_at
```

Enforce a maximum of two members at the application layer.

### memories

```text
id
space_id
uploaded_by_user_id
media_type           image | video
storage_disk
storage_path
thumbnail_path       nullable
original_name
mime_type
size_bytes
caption              nullable
taken_at              datetime/date used for sorting
created_at
updated_at
```

`taken_at` is the important field for the gallery/timeline. The UI should sort by when the memory happened, not when the file was uploaded.

For bulk uploads, the frontend sends one `file_dates[]` entry per file using browser file metadata when available. The backend can additionally inspect image EXIF metadata. Preferred date order:

1. valid EXIF capture date when available and trusted;
2. per-file date supplied by the frontend;
3. user's fallback date;
4. upload timestamp.

The date must remain editable after upload.

### comments

```text
id
memory_id
user_id
body
created_at
updated_at
```

Comments belong to an individual memory, not to the entire gallery.

## API contract

The frontend already has the matching request helpers in `src/lib/api.js`.

### Authentication

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Memories

```text
GET    /api/memories?type=all&sort=newest
GET    /api/memories/{memory}
POST   /api/memories/bulk
PATCH  /api/memories/{memory}
DELETE /api/memories/{memory}
```

Bulk upload uses multipart form data:

```text
files[]
file_dates[]
caption
fallback_date
use_file_dates
```

The batch limit, per-file size limit, allowed MIME types, and total storage quota should be configurable through Laravel config/environment values rather than hard-coded in React.

### Comments

```text
GET    /api/memories/{memory}/comments
POST   /api/memories/{memory}/comments
DELETE /api/memories/{memory}/comments/{comment}
```

### Health

```text
GET /api/health
```

## Media storage and privacy

Do not expose private memories through a permanently public Laravel `storage` URL.

Use a private storage disk. The API should return an authorized streaming/download URL or short-lived signed URL only after membership is checked. The same rule applies to thumbnails.

Local development can use Laravel's local/private disk. Production can later use an S3-compatible object store if video storage grows.

## Photo and video processing

Images can initially be stored as uploaded, with thumbnails generated after upload. Videos should not be loaded at full size in the gallery grid. Store or generate a lightweight poster/thumbnail and only stream the actual video from the memory detail view.

For large batches, background jobs should eventually handle:

- image orientation/thumbnail generation;
- EXIF date extraction;
- video metadata/poster generation;
- optional future transcoding.

The first backend version can keep this simpler and add queue processing after upload/auth/database behavior is stable.

## Frontend behavior implemented before backend

The React frontend now demonstrates the intended production experience:

- private two-person visual identity;
- photo + video cards;
- bulk file selection;
- automatic use of per-file dates when available;
- newest/oldest sorting;
- photos/videos filters;
- date-grouped timeline;
- comments attached to each memory;
- responsive memory detail dialog;
- centralized future API helper.

Session uploads intentionally use browser object URLs and disappear after refresh until the Laravel backend is connected. Prototype comments are stored in localStorage. This prevents the frontend from pretending that data is already synchronized across devices.

## Recommended implementation order

1. Keep the redesigned React frontend stable and build-tested.
2. Create `backend/` with Laravel and Sanctum.
3. Add database migrations/models for users, spaces, memories, and comments.
4. Seed the single shared space and exactly two accounts.
5. Implement auth and `shared-space.member` authorization.
6. Implement memory list/detail/edit/delete.
7. Implement private bulk media upload and date metadata handling.
8. Implement per-memory comments.
9. Replace local prototype state in React with `memoryApi` and `commentApi`.
10. Add thumbnails/background jobs for larger photo/video libraries.
11. Deploy frontend and backend with HTTPS, CORS, private storage, backups, and production environment variables.
