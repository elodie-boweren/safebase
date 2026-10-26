# SafeBase Frontend

React user interface for SafeBase (database connections, backups, schedules, restores, alerts).

For now the UI is **static**: pages read mock data from `src/data/mocks.js`. No backend is required.

Demo login: `emma@safebase.dev` / `safebase123`

## Stack

- React (Vite)
- React Router
- JavaScript

## Getting started

The frontend runs in Docker with the rest of the project: from the root, `docker compose up --build -d`, then open [http://localhost:5173](http://localhost:5173). The image builds the app with Vite and serves it with nginx (see `Dockerfile` and `nginx.conf`).

For hot reload while developing, stop the container and use Vite:

```bash
docker compose stop frontend
cd frontend
npm install
npm run dev
```

The app calls the API at `http://localhost:3000` (`src/services/api.js`, overridable with `VITE_API_URL`; in Docker it is a build argument of the `frontend` service).

### Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the Vite dev server    |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run oxlint                   |

## Project structure

```text
frontend/
├── public/
├── src/
│   ├── components/       # Shared UI (Logo, Button, Card, Navbar…)
│   ├── features/
│   │   ├── auth/         # Login / signup
│   │   └── dashboard/    # Dashboard cards
│   ├── layouts/
│   ├── pages/
│   ├── data/             # Static mocks
│   ├── services/         # REST API client (for later)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── tests/
```

## Shared components

| Component     | Role                                      |
| ------------- | ----------------------------------------- |
| `Logo`        | SAFE + BASE brand mark                    |
| `Button`      | Pill buttons (`primary` / `secondary`)    |
| `Card`        | White panel with optional title + action  |
| `Navbar`      | Top bar (logo + logout)                   |
| `Tag`         | DB type pills (MySQL / Postgres / MongoDB)|
| `StatusIcon`  | Ok / Échec status                         |
| `Badge`       | Notification count                        |
| `EmptyState`  | Empty panel placeholder                   |
| `AuthField`   | Auth label + input                        |

## Routes

| Path             | Page         |
| ---------------- | ------------ |
| `/`              | Connexion    |
| `/inscription`   | Inscription  |
| `/dashboard`     | Dashboard    |
