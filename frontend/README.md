# SafeBase Frontend

React user interface for SafeBase (database connections, backups, schedules, restores, alerts).

For now the UI is **static**: pages read mock data from `src/data/mocks.js`. No backend is required.

## Stack

- React (Vite)
- React Router
- JavaScript

## Getting started

```bash
cd frontend
npm install
npm run dev
```

The app runs on [http://localhost:5173](http://localhost:5173) by default.

When the API is ready, replace mocks with calls from `src/services/api.js` (`http://localhost:3000`, overridable with `VITE_API_URL`).

### Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start the Vite dev server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run oxlint               |

## Project structure

```text
frontend/
├── public/
├── src/
│   ├── assets/           # Static assets
│   ├── components/       # Shared UI components
│   ├── features/         # Domain features
│   │   ├── databases/
│   │   ├── backups/
│   │   ├── schedules/
│   │   ├── restores/
│   │   └── alerts/
│   ├── layouts/          # App shell / navigation
│   ├── pages/            # Routed pages (compose features)
│   ├── data/             # Static mock data (used for now)
│   ├── services/         # REST API client (for later)
│   ├── hooks/            # Shared React hooks
│   ├── utils/            # Helpers
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── tests/
```

### How layers relate

- **pages** define routes and compose feature panels
- **features** hold domain UI and logic
- **data/mocks.js** feeds the UI while the backend is not ready
- **components** hold reusable presentational pieces
- **services** will talk to the backend REST API later

## Routes

| Path          | Page            |
| ------------- | --------------- |
| `/`              | Connexion          |
| `/inscription`   | Inscription        |
| `/home`       | Home            |
| `/databases`  | Databases        |
| `/backups`    | Backups         |
| `/schedules`  | Schedules       |
| `/restores`   | Restores        |
| `/alerts`     | Alerts          |
