# Zawsze In Love — Full Stack

Zawsze In Love is a private two-person memory space built with React + Vite on the frontend and Express + SQLite on the backend.

The original pink / red / beige scrapbook aesthetic and the three original photos are preserved, but the site is now a real persistent application instead of browser-only demo data.

## Included features

- Private accounts for exactly two partners
- Create a Zawsze space and invite a partner with a unique invite code
- Relationship name, start date, and live “days together” counter
- Persistent multi-photo Gallery memories
- Captions, dates, locations, albums, favorites, edit and soft-delete
- Full-screen photo lightbox
- Love Notes with hearts, pinning, favorites, edit/delete
- “Open Later” sealed letters
- Relationship Timeline with milestone type, dates, descriptions, photos and favorites
- Global search across Gallery, Love Notes and Timeline
- “On This Day” resurfacing
- Partner notifications
- Optional 4–8 digit couple PIN for locked memories/notes/timeline items
- Authenticated media delivery so private uploads are not public static files
- ZIP backup export containing JSON data and uploaded photos
- Responsive desktop, tablet and mobile layout

## Run in VS Code

Open the repository folder in VS Code, then in the integrated terminal run:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend normally opens at `http://localhost:5173`. Vite automatically proxies `/api` requests to the backend at `http://localhost:3000`.

To run the two parts separately:

```powershell
npm run dev:backend
npm run dev:frontend
```

## Production build

```bash
npm install
npm run build
npm start
```

When `dist/` exists, the Express backend also serves the built React frontend.

Before production, set a strong `JWT_SECRET`, serve the app through HTTPS, and set:

```env
NODE_ENV=production
COOKIE_SECURE=true
```

## Private data

Live data is deliberately excluded from Git:

- SQLite database: `data/zawsze.db`
- Uploaded photos: `uploads/`
- Environment secrets: `.env`

Do not commit those files to a public repository.

## Main backend endpoints

- `/api/auth/*` — register, join, login, logout
- `/api/me` — current user/couple session
- `/api/couple/*` — relationship settings, invite, PIN lock/unlock
- `/api/albums` — album CRUD
- `/api/memories` — Gallery CRUD + multi-image upload
- `/api/notes` — Love Notes + sealed letters + hearts
- `/api/timeline` — relationship milestone CRUD + photos
- `/api/search` — global archive search
- `/api/on-this-day` — date-based resurfacing
- `/api/notifications` — partner activity
- `/api/export` — ZIP backup
