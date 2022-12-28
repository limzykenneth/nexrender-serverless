import type {NexrenderJob, NexrenderStatus} from "./types";

import {Hono} from "hono";
import {cors} from "hono/cors";
import {nanoid} from "nanoid";

const server = new Hono();
server.get("/health", (c) => c.text("ok"));
server.use("/jobs/*", (c) => {
	const id = c.env.DATABASE.idFromName("test");
	const stub = c.env.DATABASE.get(id);

	return stub.fetch(c.req);
});

const app = new Hono();
app.use("*", cors());
app.route("/api/v1", server);

export default app;

export class Database{
	state: DurableObjectState;
	jobs: Map<string, NexrenderJob>;
	app: Hono = new Hono();

	constructor(state: DurableObjectState){
		this.state = state;
		this.state.blockConcurrencyWhile(async () => {
			const jobs = await this.state.storage.list<NexrenderJob>();
			this.jobs = jobs || new Map();
		})

		const server = new Hono();
		server.post("/jobs", async (c) => {
			const now = (new Date()).toISOString();
			const jobID = nanoid();
			const job: NexrenderJob = {
				uid: jobID,
				type: "default",
				state: "queued",
				output: "",
				priority: 0,
				renderProgress: 0,
				template: {
					src: "",
					composition: ""
				},
				createdAt: now,
				updatedAt: now,
				startedAt: null,
				finishedAt: null,
				errorAt: null
			};
			console.log(`creating new job ${jobID}`);
			await this.state.storage.put(jobID, job);
			this.jobs.set(jobID, job);
			return c.json(job);
		});

		server.get("/jobs", async (c) => {
			console.log("fetching list of all jobs");
			return c.json(Array.from(this.jobs.values()));
		});

		server.get("/jobs/status", async (c) => {
			console.log("fetching status list of all jobs");
			return c.json(this.getStatus());
		});
		server.get("/jobs/pickup/:tags?", async (c) => {
			console.log("fetching a pickup job for a worker");

			let queued = [];
			for(const job of this.jobs.values()){
				if(job.state === "queued"){
					queued.push(job);
				}
			}

			if(queued.length < 1){
				return c.json({});
			}

			// FIFO (oldest-first)
			const job = queued[0];
			job.state = "picked";

			await this.state.storage.put(job.uid, job);
			this.jobs.set(job.uid, job);

			return c.json(job);
		});
		server.get("/jobs/:uid/status", async (c) => {
			const jobID = c.req.param("uid");
			console.log(`fetching job status ${jobID}`);
			return c.json(this.getStatus(jobID));
		});

		server.get("/jobs/:uid", async (c) => {
			const jobID = c.req.param("uid");
			console.log(`fetching job ${jobID}`);
			return c.json(this.jobs.get(c.req.param("uid")));
		});

		server.put("/jobs/:uid", async (c) => {
			const jobID = c.req.param("uid");
			const job: NexrenderJob = this.jobs.get(jobID);
			const updatedJob = Object.assign({}, job, await c.req.json());

			console.log(`updating job ${jobID}`);
			await this.state.storage.put(jobID, updatedJob);
			this.jobs.set(jobID, updatedJob);

			return c.json(updatedJob);
		});

		server.delete("/jobs/:uid", async (c) => {
			const jobID = c.req.param("uid");

			console.log(`removing job ${jobID}`);
			const success = await this.state.storage.delete(jobID);
			if(success) this.jobs.delete(jobID);

			return c.json({ id: jobID, removed: success });
		});

		this.app.route("/api/v1", server);
	}

	async fetch(request: Request): Promise<Response> {
		return this.app.fetch(request);
	}

	getStatus(jobID?: string): NexrenderStatus|NexrenderStatus[] {
		if(jobID){
			const job: NexrenderJob = this.jobs.get(jobID);

			return {
				uid: job.uid,
				state: job.state,
				type: job.type,
				renderProgress: job.renderProgress,
				createdAt: job.createdAt,
				updatedAt: job.updatedAt,
				startedAt: job.startedAt,
				finishedAt: job.finishedAt,
				errorAt: job.errorAt
			};
		}else{
			const result = [];
			for(const job of this.jobs.values()){
				result.push({
					uid: job.uid,
					state: job.state,
					type: job.type,
					renderProgress: job.renderProgress,
					createdAt: job.createdAt,
					updatedAt: job.updatedAt,
					startedAt: job.startedAt,
					finishedAt: job.finishedAt,
					errorAt: job.errorAt
				});
			}

			return result;
		}
	}
}