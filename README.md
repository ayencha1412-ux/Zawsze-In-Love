# Zawsze in Love

A private two-person memory website built with React + Vite and designed to grow into a Laravel-backed full-stack app.

The project keeps the soft pink, red, beige, paper, and polaroid visual language while moving away from a one-page apology site into a shared archive for two people.

## Current frontend

The React frontend now includes:

- a private two-person visual identity;
- a shared memory gallery using the existing photos;
- photo and video support;
- bulk media selection for mass uploads;
- automatic use of each selected file's date when available;
- newest-first and oldest-first sorting;
- All / Photos / Videos filters;
- a date-grouped timeline;
- a responsive memory detail view;
- comments attached to each individual memory;
- a You / Love identity toggle for prototype comments;
- mobile, tablet, and desktop layouts;
- a centralized API client in `src/lib/api.js` prepared for Laravel.

Until the backend is connected, newly selected media is intentionally session-only and prototype comments use `localStorage`. This avoids pretending that the two devices are already synchronized.

## Run locally in VS Code

```bash
npm install
npm run dev
```

Vite will print the local address, usually:

```text
http://localhost:5173/
```

If another Vite process is already running, it may use `5174` or another nearby port.

## Build the frontend

```bash
npm run build
```

## GitHub workflow

This repository is already connected to:

```text
ayencha1412-ux/Zawsze-In-Love
```

To receive changes made on GitHub in the local VS Code copy:

```bash
git pull
```

To send local changes back to GitHub:

```bash
git add .
git commit -m "Describe the change"
git push
```

## Full-stack direction

Zawsze will follow the useful architectural pattern from IntelliBridge without sharing IntelliBridge code or business logic:

```text
React + Vite frontend
        ↓
centralized API client
        ↓
Laravel REST API
        ↓
Sanctum authentication
        ↓
MySQL/PostgreSQL database
        ↓
private photo/video storage
```

There will be no public registration. The production app is intended for exactly two authorized accounts sharing one private space.

The backend will support:

- private login for the two users;
- database-backed memories;
- private photo/video storage;
- bulk uploads;
- per-file memory dates;
- date sorting and timeline grouping;
- per-memory comments;
- edit/delete controls;
- authorized media streaming;
- deployment configuration, backups, CORS, and HTTPS.

The detailed database schema, endpoint contract, privacy model, and recommended Laravel implementation order are documented in:

```text
docs/FULL_STACK_BLUEPRINT.md
```

## API environment

The future Laravel API URL is configured with:

```env
VITE_API_URL=http://localhost:8000/api
```

The frontend request layer is centralized in:

```text
src/lib/api.js
```

That file already defines the planned authentication, bulk-memory, and comment API calls so the React components will not need backend URLs scattered throughout the interface.
