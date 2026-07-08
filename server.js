const http = require("node:http");

const PORT = process.env.PORT || 3000;

let nextId = 1;
const todos = [];

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

	if (req.method === "GET" && url.pathname === "/todos") {
		return json(res, 200, todos);
	}

	const idMatch = url.pathname.match(/^\/todos\/(\d+)$/);
	if (req.method === "GET" && idMatch) {
		const id = Number(idMatch[1]);
		const todo = todos.find((t) => t.id === id);
		if (!todo) {
			return json(res, 404, { error: "not found" });
		}
		return json(res, 200, todo);
	}

	if (req.method === "POST" && url.pathname === "/todos") {
		let body;
		try {
			body = await readBody(req);
		} catch {
			return json(res, 400, { error: "invalid JSON" });
		}
		const todo = { id: nextId++, title: body.title, done: false };
		todos.push(todo);
		return json(res, 201, todo);
	}

	return json(res, 404, { error: "not found" });
});

if (require.main === module) {
	server.listen(PORT, () => {
		console.log(`agreemint listening on http://localhost:${PORT}`);
	});
}

module.exports = { server, todos };
