const http = require("node:http");
const { createStore } = require("./store.js");

const PORT = process.env.PORT || 3000;

// The store is initialized asynchronously (it may need to connect to Postgres
// and create the table). Every request waits on this promise before touching
// the store, so requests that arrive during startup are handled correctly.
const storeReady = createStore();

function json(res, status, body) {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(body));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on("data", (c) => chunks.push(c));
		req.on("end", () => {
			try {
				resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
			} catch (err) {
				reject(err);
			}
		});
		req.on("error", reject);
	});
}

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);

	try {
		const store = await storeReady;

		if (req.method === "GET" && url.pathname === "/todos") {
			return json(res, 200, await store.list());
		}

		if (req.method === "POST" && url.pathname === "/todos") {
			let body;
			try {
				body = await readBody(req);
			} catch {
				return json(res, 400, { error: "invalid JSON" });
			}
			const todo = await store.create(body.title);
			return json(res, 201, todo);
		}

		const match = url.pathname.match(/^\/todos\/(\d+)$/);
		if (req.method === "GET" && match) {
			const todo = await store.get(Number(match[1]));
			if (!todo) return json(res, 404, { error: "not found" });
			return json(res, 200, todo);
		}

		return json(res, 404, { error: "not found" });
	} catch (err) {
		return json(res, 500, { error: err.message });
	}
});

if (require.main === module) {
	server.listen(PORT, () => {
		console.log(`agreemint listening on http://localhost:${PORT}`);
	});
}

module.exports = { server, storeReady };
