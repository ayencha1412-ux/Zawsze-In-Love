# Full Stack Zawsze Web — Frontend

A cleaned-up React + Vite version of the original self-contained apology website. The original visual identity, message flow, interactions, and all three photos are preserved, but the code is now split into reusable files so it is easier to develop in VS Code and later connect to a backend.

## What changed

- Preserved the beige / red / pink paper aesthetic, polaroid photos, wax-seal envelope, reveal interactions, progress hearts, and ambient music.
- Extracted the original Base64 photos into normal WebP assets for faster editing and cleaner source control.
- Converted the frontend to React components.
- Improved desktop/mobile spacing, card hierarchy, section backgrounds, progress navigation, focus states, and reduced-motion accessibility.
- Added an API helper and `.env.example` so the frontend is ready for a future backend.

## Run in VS Code

1. Extract this project folder.
2. Open the folder in VS Code.
3. Open a terminal in VS Code.
4. Run:

```bash
npm install
npm run dev
```

Vite will show a local URL, usually `http://localhost:5173`.

## Build for production

```bash
npm run build
```

The production files will be created in `dist/`.

## GitHub setup

Create an empty GitHub repository, then run inside this folder:

```bash
git init
git add .
git commit -m "Initial Zawsze frontend"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If the repository already exists locally, do not run `git init` again; just add/commit/push the changed files.

## Future backend connection

Copy `.env.example` to `.env` and set the backend API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

Use `src/lib/api.js` for requests. This keeps backend calls in one place instead of scattering `fetch()` throughout components.

A future full-stack structure can be:

```text
full-stack-zawsze-web/
├─ frontend/   # this Vite/React app
└─ backend/    # Laravel, Express, Django, etc.
```

Possible backend features later: private access/login, view tracking, reply/message form, admin editing of story content, photo management, deployment configuration, and database-backed content.
