# SafeBase

SafeBase is a solution for **managing database backups and restores**, developed as a **REST API** with a user interface.

The project aims to provide users with a simple way to manage database connections, schedule automated backups, keep a history of backup versions, and restore a database when needed.

---

## 📋 Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [Architecture](#-architecture)
* [Technologies](#-technologies)
* [Supported Databases](#-supported-databases)
* [Containerization](#-containerization)
* [Testing](#-testing)
* [Code Quality & Best Practices](#-code-quality--best-practices)
* [Installation](#-installation)
* [Usage](#-usage)
* [Project Management](#-project-management)
* [Documentation](#-documentation)
* [Team](#-team)

---

## 📖 Overview

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

## 🚀 Features

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

## 🏗️ Architecture

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

The final architecture and the detailed organization of the application layers will be documented as the project evolves.

---

## 🛠️ Technologies

The final technology stack will be defined during the design phase of the project.

The project requirements include:

* a **REST API** developped with **Node.js**;
* a **React** frontend application;
* **MySQL**;
* **PostgreSQL**;
* **MongoDB**;
* **Docker**;
* **cron** for scheduled operations;
* native MySQL, MongoDB and PostgreSQL backup utilities;
* automated testing tools.

### API Framework

The project backend using Node.js, the best suited REST API framework is **Fastify**, a fast web framework for Node.js: `https://fastify.dev/`.

---

## 🗄️ Supported Databases

SafeBase supports the following database management systems:

| Database   | Backup utility |
| ---------- | -------------- |
| MySQL      | `mysqldump`    |
| PostgreSQL | `pg_dump`      |
| MongoDB    | `mongodump`    |

Restore operations will use the appropriate tools for each database system.

---

## 🐳 Containerization

The application is designed to be fully containerized using **Docker**.

The environment will include:

```text
SafeBase
│
├── Frontend
├── API
├── MySQL
├── PostgreSQL
└── MongoDB
```

Docker will make it easier to reproduce the development environment and run the different components of the application consistently.

---

## 🧪 Testing

Testing is an integral part of the project.

Tests will cover areas such as:

* API functionality;
* database connections;
* backup execution;
* restore operations;
* error handling;
* relevant frontend components.

Potential testing tools include:

* Jest
* Vitest
* Cypress

The final testing stack will depend on the technologies selected for the project.

---

## 🔐 Code Quality & Best Practices

The project follows common development standards to ensure code quality, consistency and maintainability.

### Naming Conventions

Naming conventions apply to:

* files and directories;
* variables and functions;
* classes;
* database objects;
* code organization.

### Code Review

Pull Requests must be **reviewed and approved by another team member** before they can be merged.

The development workflow is:

```text
Create branch
     ↓
Development
     ↓
Pull Request
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

## 💻 Installation

> This section will be completed once the final technology stack and project configuration have been defined.

### Prerequisites

The exact prerequisites will depend on the technologies selected.

The development environment will need to support:

* the API;
* the frontend;
* MySQL;
* PostgreSQL;
* Docker.

### Clone the repository

```bash
git clone https://github.com/elodie-boweren/safebase.git
cd safebase
```

### Install dependencies

```bash
<INSTALL_COMMAND>
```

### Start the application

```bash
<START_COMMAND>
```

---

## ▶️ Usage

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

The final repository structure will be defined as the project develops.

A possible structure is:

```text
plateforme-safebase/
│
├── api/
│   ├── src/
│   └── tests/
│
├── frontend/
│   ├── src/
│   └── tests/
│
├── docker/
│
├── docs/
│   ├── architecture/
│   ├── database/
│   └── tests/
│
├── docker-compose.yml
├── README.md
└── ...
```

---

## 📌 Project Management

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

## 🎯 Learning Objectives

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

## 📄 License

This project was developed for educational purposes.
