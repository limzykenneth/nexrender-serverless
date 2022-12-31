import {Hono} from "hono";
import {cors} from "hono/cors";
export {Database} from "./Database";

const server = new Hono();
server.get("/health", (c) => c.text("ok"));
server.use("/jobs/*", async (c) => {
	const tenantName = c.req.header("nexrender-tenant") || "default";
	const nexrenderDB = c.env.NEXRENDER_D1;
	const id = c.env.DATABASE.idFromName(tenantName);

	if(!nexrenderDB && tenantName !== "default"){
		return c.text("Unregistered nexrender tenant, please check the \"nexrender-tenant\" header", 400);
	}else if(nexrenderDB){
		const results = await nexrenderDB
			.prepare("SELECT * FROM Tenants WHERE Name = ?")
			.bind(tenantName)
			.first();

		if(!results && tenantName !== "default"){
			return c.text("Unregistered nexrender tenant, please check the \"nexrender-tenant\" header", 400);
		}else if(results && results.ObjectID === null){
			// Populate object ID
			await nexrenderDB
				.prepare("UPDATE Tenants SET ObjectID = ? WHERE NAME = ?")
				.bind(id.toString(), tenantName)
				.run();
		}
	}

	const stub = c.env.DATABASE.get(id);

	return stub.fetch(c.req);
});

const app = new Hono();
app.use("*", cors());
app.route("/api/v1", server);

export default app;
