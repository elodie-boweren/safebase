# SafeBase

SafeBase is a solution for **managing database backups and restores**, developed as a **REST API** with a user interface.

The project aims to provide users with a simple way to manage database connections, schedule automated backups, keep a history of backup versions, and restore a database when needed.

---

## Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [Architecture](#-architecture)
* [Technologies](#-technologies)
* [Supported Databases](#-supported-databases)
* [Containerization](#-containerization)
* [Testing](#-testing)
* [Code Quality & Best Practices](#-code-quality--best-practices)
* [Continuous Integration](#-continuous-integration)
* [Installation](#-installation)
* [Usage](#-usage)
* [Project Management](#-project-management)
* [Documentation](#-documentation)
* [Team](#-team)

---

## Overview

In today's business environment, data is one of an organization's most valuable assets. Data loss can have serious consequences, making reliable backup and restore mechanisms essential.

SafeBase provides a solution to:

* manage connections to different databases;
* perform regular backups;
* automate backup processes;
* keep a history of backup versions;
* select a specific backup version for restoration;
* detect problems during backup and restore operations;
* notify users when an operation fails;
* manage these processes through a user-friendly interface.

The project supports both **MySQL, PostgreSQL and MongoDB** databases.

---

## Features

### Database Management

* Add a database connection.
* View configured databases.
* Manage the information required to connect to a database.
* Support MySQL, PostgreSQL and MongoDB.

### 💾 Backups

SafeBase provides database backup capabilities including:

* manual backups;
* automated backups;
* scheduled backups;
* use of native database system utilities;
* error handling during backup operations.

MySQL, PostgreSQL and MongoDB backups rely on their respective native command-line utilities.

### 🕐 Scheduling

Backups can be scheduled to run automatically.

The scheduling system is based on the **cron standard**.

### 📚 Backup Version Management

SafeBase keeps a history of database backups.

Users can:

* view available backups;
* identify different backup versions;
* select a specific version to restore.

### ♻️ Restore

The application allows users to restore a database from an existing backup.

### 🔔 Monitoring & Alerts

SafeBase detects problems occurring during:

* backup operations;
* restore operations.

Alerts are generated to notify users through the interface when an operation fails.

### 🖥️ User Interface

A user interface allows users to easily manage:

* databases;
* backups;
* backup history;
* restore operations;
* alerts and errors.

---

## Architecture

SafeBase is designed as a **layered application**.

The overall architecture is structured around the following components:

```text
┌──────────────────────────────┐
│           Frontend           │
│        User Interface        │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│           REST API           │
│                              │
│  Routes / Controllers        │
│  Services / Business Logic   │
│  Data Access                 │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐───────────────┐
       ▼                ▼               ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────┐
│    MySQL    │  │ PostgreSQL  │    |  MongoDB    |
└─────────────┘  └─────────────┘    └─────────────┘
```

---

## Technologies

* a **REST API** developed with **Node.js 22** and **Express**
* a **React** frontend application built with **Vite**
* **MySQL**
* **PostgreSQL** (also used as the application's own database)
* **MongoDB**
* **Docker** / **Docker Compose**
* **JWT** for authentication
* **cron** for scheduled operations
* native MySQL, MongoDB and PostgreSQL backup utilities
* automated testing tools
* **Oxlint** for linting
* **GitHub Actions** for continuous integration

---

## Supported Databases

SafeBase supports the following database management systems:

| Database   | Backup utility |
| ---------- | -------------- |
| MySQL      | `mysqldump`    |
| PostgreSQL | `pg_dump`      |
| MongoDB    | `mongodump`    |

Restore operations will use the appropriate tools for each database system.

---

## Containerization

The whole application runs with **Docker Compose**: one command starts the frontend, the API and the databases.

| Service (`docker-compose.yml`)     | Container           | Port    |
| ---------------------------------- | ------------------- | ------- |
| `frontend` (built from `frontend/`) | `safebase_frontend` | `5173`  |
| `backend` (built from `api/`)      | `safebase_backend`  | `3000`  |
| `postgres`                         | `safebase_postgres` | `5432`  |
| `mysql`                            | `safebase_mysql`    | `3306`  |
| `mongodb`                          | `safebase_mongo`    | `27017` |

The frontend image builds the React app with Vite, then serves the static files with nginx ([frontend/Dockerfile](frontend/Dockerfile), [frontend/nginx.conf](frontend/nginx.conf)). It is exposed on port `5173` because the API only accepts requests from `http://localhost:5173` (CORS).

Docker makes it easier to reproduce the development environment and run the different components of the application consistently.

---

## Testing

Testing is an integral part of the project.

Tests will cover areas such as:

* API functionality
* database connections
* backup execution
* restore operations
* error handling
* relevant frontend components

Testing tools include:

* Jest
* Vitest
* Cypress

**Unit tests** run on your computer (not in Docker) and do not need the containers to be started:
the databases and the dump tools are mocked.

| Part     | Tool                             | Location               | Command                          |
| -------- | -------------------------------- | ---------------------- | -------------------------------- |
| API      | Jest                             | `api/tests/unit/`      | `cd api && npm test`             |
| Frontend | Vitest + React Testing Library   | `frontend/tests/unit/` | `cd frontend && npm test`        |

After pulling, run `npm install` in `api/` and `frontend/` to get the test tools.
`npm test` starts Vitest in watch mode in the frontend; use `npx vitest run` for a single run (as in the CI).

Unit tests also run automatically on every Pull Request (see [Continuous Integration](#-continuous-integration)).

Test files follow the acceptance test plan ([docs/testings/SAFEBASE - TestPlan.pdf](docs/testings/SAFEBASE%20-%20TestPlan.pdf)):
each test name references the case it covers (e.g. `US02-07`).
Cases that need the full stack (deployment, UI, real restores) are tested manually,
and the API endpoints with the Postman collection ([docs/testings/TESTS_API.md](docs/testings/TESTS_API.md)).


---

## Code Quality & Best Practices

The project follows common development standards to ensure code quality, consistency and maintainability.

### Naming Conventions

Naming conventions apply to:

* files and directories;
* variables and functions;
* classes;
* database objects;
* code organization.

### Linting

The API and the frontend are both checked with [Oxlint](https://oxc.rs/docs/guide/usage/linter), a fast JavaScript linter that detects likely bugs and misuse of frameworks without running the code.

| Part     | Configuration                                    | Main rules                                                                |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| API      | [api/.oxlintrc.json](api/.oxlintrc.json)           | Node.js and Jest plugins, `correctness` errors, `suspicious` warnings, `eqeqeq` |
| Frontend | [frontend/.oxlintrc.json](frontend/.oxlintrc.json) | React plugin, `rules-of-hooks`                                            |

Run it from `api/` or `frontend/`:

```bash
npm run lint
```

Errors make the command (and the CI) fail; warnings are only reported.
The `oxc/no-async-endpoint-handlers` rule is disabled in the API: Express 5 forwards errors from `async` handlers natively.

### Code Review

Pull Requests must **pass the CI checks** and be **reviewed and approved by another team member** before they can be merged.

The development workflow is:

```text
Create branch
     ↓
Development
     ↓
Pull Request
     ↓
CI checks (lint, tests, build)
     ↓
Code Review
     ↓
Changes if required
     ↓
Approval
     ↓
Merge
```

### Documentation

Important technical decisions and source code should be properly documented.

---

## Continuous Integration

The CI runs with **GitHub Actions**, defined in [.github/workflows/ci.yml](.github/workflows/ci.yml).

It is triggered on:

* every **Pull Request** targeting `main`;
* every **push** on `main` (e.g. after a merge).

Two jobs run in parallel on an Ubuntu runner with **Node.js 22**:

| Job                              | Directory   | Steps                                                       |
| -------------------------------- | ----------- | ----------------------------------------------------------- |
| `API (tests Jest)`               | `api/`      | `npm ci` → `npm run lint` → `npm test`                      |
| `Frontend (lint, tests, build)`  | `frontend/` | `npm ci` → `npm run lint` → `npx vitest run` → `npm run build` |

* `npm ci` installs the exact versions from `package-lock.json` (npm cache is enabled to speed up runs).
* The CI only runs the unit tests: databases and dump tools are mocked, so no Docker container is needed.
* `npm run build` checks that the frontend compiles.

The result is shown at the bottom of each Pull Request and in the **Actions** tab of the repository. If a job fails, open it to read the logs of the failing step.

To check your changes before pushing, run the same commands locally:

```bash
cd api && npm ci && npm run lint && npm test
cd ../frontend && npm ci && npm run lint && npx vitest run && npm run build
```

---

## Installation

### Prerequisites

* **Git**
* **Docker Desktop** (includes Docker Compose) — see [DOCKER.md](DOCKER.md) for installation on Windows, macOS and Linux
* **Node.js 22** (LTS) and npm — only needed to run the tests, the linter or the frontend outside Docker

Ports `3000`, `3306`, `5432`, `27017` and `5173` must be free. If MySQL, PostgreSQL or MongoDB is already installed and running on your computer, stop it first, otherwise the containers will fail to start.

### 1. Clone the repository

```bash
git clone https://github.com/elodie-boweren/safebase.git
cd safebase
```

### 2. Environment variables

No `.env` file is required for now: development values are already set in `docker-compose.yml`. See [.env.example](.env.example) for the variables that can be overridden.

### 3. Start the application (Docker)

Make sure Docker Desktop is running, then from the root of the project:

```bash
docker compose up --build -d
```

This command builds the frontend and API images and starts the frontend, the API, PostgreSQL, MySQL and MongoDB containers.

On the first start, PostgreSQL automatically creates the application tables from [db/schema.sql](db/schema.sql).

Check that the containers are running:

```bash
docker compose ps
```

Then open http://localhost:3000/api/health in a browser: a JSON response confirms that the API is running.

### 4. Open the application

The interface is available at http://localhost:5173. Create an account with « S'inscrire », then log in.

After a change in `frontend/` or `api/`, run `docker compose up --build -d` again to rebuild the images.

### Useful commands

| Command                           | Description                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| `docker compose ps`               | List the containers and their state                          |
| `docker compose logs -f backend`  | Follow the API logs                                          |
| `docker compose logs -f frontend` | Follow the nginx logs of the frontend                        |
| `docker compose up --build -d`    | Rebuild the images after a change in `frontend/` or `api/`   |
| `docker compose down`             | Stop the containers (data is kept)                           |
| `docker compose down -v`          | Stop the containers **and delete all database data**         |

### Troubleshooting

**Tables are missing / database schema is outdated**
`db/schema.sql` is only executed when the PostgreSQL volume is created for the first time. If you started the project before the schema existed or changed, reset the volumes (this deletes all local data):

```bash
docker compose down -v
docker compose up --build -d
```

**A container fails to start with "port is already allocated"**
Another program is using that port (often a local MySQL or PostgreSQL). Stop it and run `docker compose up -d` again.

### Running the frontend outside Docker (optional)

For hot reload while working on the interface, stop the frontend container (it uses port `5173`) and start Vite:

```bash
docker compose stop frontend
cd frontend
npm install
npm run dev
```

### Running the API outside Docker (optional)

To run the API directly on your computer (e.g. for auto-reload), keep the database containers running, then:

```bash
docker compose stop backend
cd api
npm install
npm run dev
```

The API connects to PostgreSQL on `localhost:5432` with the default development credentials.

---

##  Usage

Once the application is running, users will be able to:

1. Add a database connection.
2. Configure a backup schedule.
3. Run or wait for a scheduled backup.
4. View the backup history.
5. Select a backup version.
6. Restore the database.
7. View alerts and error messages.

---

## 📁 Project Structure

```text
safebase/
│
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI (lint, tests, build)
│
├── api/                  # REST API (Node.js / Express)
│   ├── Dockerfile
│   ├── .oxlintrc.json    # linter configuration
│   ├── server.js         # routes and server entry point
│   ├── db.js             # PostgreSQL connection pool
│   ├── encryption.js     # encryption of stored DB passwords
│   └── tests/unit/       # Jest unit tests
│
├── frontend/             # React application (Vite)
│   ├── .oxlintrc.json    # linter configuration
│   ├── src/
│   └── tests/unit/       # Vitest unit tests
│
├── db/
│   └── schema.sql        # application schema, loaded on first PostgreSQL start
│
├── docs/
│   ├── database/         # MCD / MLD / MPD
│   └── testings/         # test plan, Postman collection
│
├── docker-compose.yml
├── DOCKER.md
├── .env.example
└── README.md
```

---

## Project Management

The project is developed collaboratively using project management and version control tools.

### Git Workflow

Development is carried out on dedicated branches and integrated through Pull Requests.

```text
main
 │
 ├── feature/...
 ├── fix/...
 └── ...
```

### Trello

Project tasks are managed using a Kanban board.

The workflow is organized into the following stages:

```text
BACKLOG → TODO → ONGOING → CODE REVIEW → TEST → DONE
```

Labels are used to identify the technical area of each task:

* `Database`
* `Backend / API`
* `Frontend`
* `Architecture`
* `Docker / Infrastructure`
* `Cron`
* `Security`
* `Testing`
* `CI/CD`
* `Quality / Standards`
* `Documentation`

---

## 📚 Documentation

Project documentation will include:

* requirements analysis;
* project specifications;
* software architecture;
* conceptual data model (CDM / MCD);
* logical data model (LDM / MLD);
* physical data model (PDM / MPD);
* API documentation;
* testing strategy;
* deployment documentation;
* backup and restore procedures.

---

## Learning Objectives

This project provides an opportunity to work on:

* application design;
* software architecture;
* relational database design;
* REST API development;
* frontend development;
* application security;
* containerization;
* automated testing;
* CI/CD;
* DevOps practices;
* collaborative development using Git and GitHub.

---

## 👥 Team

Project developed as part of the **La Plateforme_** training program by Armelle, Elodie and Emmanuelle.

**Repository:** `safebase`

---

## License

This project was developed for educational purposes.
