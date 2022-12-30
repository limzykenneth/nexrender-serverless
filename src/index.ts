import {Hono} from "hono";
import {cors} from "hono/cors";
export {Database} from "./Database";

const server = new Hono();
server.get("/health", (c) => c.text("ok"));
server.use("/jobs/*", (c) => {
	const id = c.env.DATABASE.idFromName("default");
	const stub = c.env.DATABASE.get(id);

	return stub.fetch(c.req);
});

const app = new Hono();
app.use("*", cors());
app.route("/api/v1", server);

export default app;
