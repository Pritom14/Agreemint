# Agreemint

A deliberately tiny TODO API. This repo is a **sandbox target for Agent Orchestrator e2e testing**: AO spawns agents against the dummy issues here, agents open PRs here, and the e2e platform asserts the full PR flow without touching any real project.

## Run

```bash
npm start          # serves on http://localhost:3000
npm test           # node --test
```

## API

| Method | Path | Description |
|---|---|---|
| GET | /todos | List all todos |
| POST | /todos | Create a todo `{ "title": "..." }` |

The API is intentionally incomplete. Missing pieces are tracked as issues and exist to give agents real, verifiable work.

## Notes

- In-memory storage only, state resets on restart (by design, keeps e2e runs clean)
- No dependencies, plain `node:http` and `node --test`
- Anything in this repo may be wiped between e2e runs
