const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { server } = require("../server.js");

function request(method, path, body) {
	return new Promise((resolve, reject) => {
		const addr = server.address();
		const req = http.request(
			{ host: "127.0.0.1", port: addr.port, method, path, headers: { "Content-Type": "application/json" } },
			(res) => {
				const chunks = [];
				res.on("data", (c) => chunks.push(c));
				res.on("end", () => {
					const text = Buffer.concat(chunks).toString("utf8");
					resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null });
				});
			},
		);
		req.on("error", reject);
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}

test("todo lifecycle", async (t) => {
	await new Promise((resolve) => server.listen(0, resolve));
	t.after(() => server.close());

	const empty = await request("GET", "/todos");
	assert.strictEqual(empty.status, 200);
	assert.ok(Array.isArray(empty.body));

	const created = await request("POST", "/todos", { title: "write tests" });
	assert.strictEqual(created.status, 201);
	assert.strictEqual(created.body.title, "write tests");
	assert.strictEqual(created.body.done, false);
	assert.ok(typeof created.body.id === "number");

	const listed = await request("GET", "/todos");
	assert.strictEqual(listed.status, 200);
	assert.ok(listed.body.some((t) => t.id === created.body.id));

	const missing = await request("GET", "/nope");
	assert.strictEqual(missing.status, 404);
});
