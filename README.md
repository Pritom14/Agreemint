# Agreemint

A deliberately tiny TODO API. This repo is a **sandbox target for Agent Orchestrator e2e testing**: AO spawns agents against the dummy issues here, agents open PRs here, and the e2e platform asserts the full PR flow without touching any real project.

## Run

```bash
npm install        # installs pg
npm start          # serves on http://localhost:3000
npm test           # node --test
```

## Storage

Todos are persisted in Postgres when `DATABASE_URL` is set:

```bash
docker compose up -d   # starts a local Postgres (see docker-compose.yml)
DATABASE_URL='postgres://agreemint:agreemint@localhost:5432/agreemint' npm start
```

On startup the `todos` table is created if it does not exist, and created todos
survive a process restart. When `DATABASE_URL` is unset or the database is
unreachable (e.g. CI without a DB service), the store falls back to an in-memory
array so the API and tests keep working.

## API

| Method | Path | Description |
|---|---|---|
| GET | /todos | List all todos |
| GET | /todos/:id | Get a single todo |
| POST | /todos | Create a todo `{ "title": "..." }` |

The API is intentionally incomplete. Missing pieces are tracked as issues and exist to give agents real, verifiable work.

## Notes

- Postgres-backed storage via `DATABASE_URL`, with an in-memory fallback when no DB is available
- The `pg` package is the only runtime dependency; otherwise plain `node:http` and `node --test`
- Anything in this repo may be wiped between e2e runs
