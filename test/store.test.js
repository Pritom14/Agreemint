const test = require("node:test");
const assert = require("node:assert");
const { createStore } = require("../store.js");

// The in-memory fallback must always work, with or without a database.
test("memory fallback works without DATABASE_URL", async () => {
	const store = await createStore({ connectionString: "" });
	assert.strictEqual(store.backend, "memory");

	const created = await store.create("hello");
	assert.strictEqual(created.title, "hello");
	assert.strictEqual(created.done, false);
	assert.ok(typeof created.id === "number");

	const fetched = await store.get(created.id);
	assert.strictEqual(fetched.id, created.id);

	const all = await store.list();
	assert.ok(all.some((t) => t.id === created.id));

	assert.strictEqual(await store.get(999999), null);
	await store.close();
});

// Real Postgres path: only runs when a DATABASE_URL is provided and reachable.
// Verifies that a created todo is readable through a brand-new store instance,
// which is what "survives a process restart" means in practice.
test("postgres persists across store instances", async (t) => {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		t.skip("DATABASE_URL not set");
		return;
	}

	const store = await createStore({ connectionString });
	if (store.backend !== "postgres") {
		await store.close();
		t.skip("Postgres not reachable");
		return;
	}

	const title = `persist-${Date.now()}`;
	const created = await store.create(title);
	await store.close();

	// Simulate a restart with a fresh connection/pool.
	const reopened = await createStore({ connectionString });
	assert.strictEqual(reopened.backend, "postgres");
	const fetched = await reopened.get(created.id);
	assert.ok(fetched, "todo should still exist after reopening the store");
	assert.strictEqual(fetched.title, title);
	await reopened.close();
});
