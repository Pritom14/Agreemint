// Todo store with a Postgres backend and an in-memory fallback.
//
// When DATABASE_URL is set and reachable, todos are persisted in Postgres and
// survive process restarts. When it is unset or the database cannot be reached
// (e.g. in CI without a DB service), the store transparently falls back to an
// in-memory array so the API and tests keep working.

let pg = null;
try {
	pg = require("pg");
} catch {
	// pg not installed; only the in-memory fallback is available.
}

function createMemoryStore() {
	let nextId = 1;
	const todos = [];
	return {
		backend: "memory",
		async init() {},
		async close() {},
		async list() {
			return todos.map((t) => ({ ...t }));
		},
		async get(id) {
			const found = todos.find((t) => t.id === id);
			return found ? { ...found } : null;
		},
		async create(title) {
			const todo = { id: nextId++, title, done: false };
			todos.push(todo);
			return { ...todo };
		},
	};
}

function createPgStore(connectionString) {
	const pool = new pg.Pool({ connectionString });
	return {
		backend: "postgres",
		pool,
		async init() {
			await pool.query(`
				CREATE TABLE IF NOT EXISTS todos (
					id serial PRIMARY KEY,
					title text,
					done boolean NOT NULL DEFAULT false
				)
			`);
		},
		async close() {
			await pool.end();
		},
		async list() {
			const { rows } = await pool.query(
				"SELECT id, title, done FROM todos ORDER BY id",
			);
			return rows;
		},
		async get(id) {
			const { rows } = await pool.query(
				"SELECT id, title, done FROM todos WHERE id = $1",
				[id],
			);
			return rows[0] || null;
		},
		async create(title) {
			const { rows } = await pool.query(
				"INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done",
				[title],
			);
			return rows[0];
		},
	};
}

// Build the store, attempting Postgres first and falling back to memory on any
// failure. Returns a ready-to-use store; init() has already completed.
async function createStore({ connectionString = process.env.DATABASE_URL } = {}) {
	if (connectionString && pg) {
		const store = createPgStore(connectionString);
		try {
			await store.init();
			return store;
		} catch (err) {
			console.warn(
				`Postgres unavailable (${err.message}); falling back to in-memory store`,
			);
			try {
				await store.close();
			} catch {
				// ignore cleanup errors
			}
		}
	}
	const memory = createMemoryStore();
	await memory.init();
	return memory;
}

module.exports = { createStore, createMemoryStore, createPgStore };
