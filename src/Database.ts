import type {NexrenderJob, NexrenderStatus} from "./types";

import {Hono} from "hono";
import {nanoid} from "nanoid";

interface Env{
	NEXRENDER_SECRET?: string
}

export class Database{
	state: DurableObjectState;
	secret: string;
	jobs: Map<string, NexrenderJob>;
	app: Hono = new Hono();

	constructor(state: DurableObjectState, env: Env){
		this.state = state;
		this.secret = env.NEXRENDER_SECRET || null;
		this.state.blockConcurrencyWhile(async () => {
			const jobs = await this.state.storage.list<NexrenderJob>();
			this.jobs = jobs || new Map();
		});

		const server = new Hono();

		server.use("*", async (c, next) => {
			if(this.secret === null){
				await next();
			}else if(c.req.header("nexrender-secret") === this.secret){
				await next();
			}else{
				return c.text("Wrong or no authentication secret provided. Please check the \"nexrender-secret\" header.", 403);
			}
		});

		server.post("/jobs", async (c) => {
			const now = (new Date()).toISOString();
			const jobRequest = await c.req.json() as NexrenderJob;

			const jobID = nanoid();
			const job: NexrenderJob = Object.assign({
				uid: jobID,
				type: "default",
				state: "queued",
				output: "",
				priority: 0,
				tags: "",
				renderProgress: 0,
				template: {
					src: "",
					composition: ""
				},
				assets: [],
				actions: {
					prerender: [],
					postrender: []
				},
				createdAt: now,
				updatedAt: now,
				startedAt: null,
				finishedAt: null,
				errorAt: null,
				creator: c.req.header("x-forwarded-for") || c.req.header("CF-Connecting-IP"),
				executor: null,
				error: null
			}, jobRequest);

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

			const queued = [];
			for(const job of this.jobs.values()){
				if(job.state === "queued"){
					queued.push(job);
				}
			}

			if(queued.length < 1){
				return c.json({});
			}

			const now = (new Date()).toISOString();
			// FIFO (oldest-first)
			const job = queued[0];
			job.state = "picked";
			job.updatedAt = now;
			job.executor = c.req.header("x-forwarded-for") || c.req.header("CF-Connecting-IP");

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
			if(!job) return c.text("Not Found", 404);

			const now = (new Date()).toISOString();
			const updatedJob = Object.assign(
				{},
				job,
				await c.req.json(),
				{updatedAt: now}
			);

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


	getStatus(): NexrenderStatus[];
	getStatus(jobID: string): NexrenderStatus;
	getStatus(jobID?: string): NexrenderStatus|NexrenderStatus[] {
		if(jobID){
			const job: NexrenderJob = this.jobs.get(jobID);

			return {
				uid: job.uid,
				state: job.state,
				type: job.type,
				tags: job.tags,
				renderProgress: job.renderProgress,
				error: job.error,
				createdAt: job.createdAt,
				updatedAt: job.updatedAt,
				startedAt: job.startedAt,
				finishedAt: job.finishedAt,
				errorAt: job.errorAt,
				jobCreator: job.creator,
				jobExecutor: job.executor
			};
		}else{
			const result: NexrenderStatus[] = [];
			for(const job of this.jobs.values()){
				result.push({
					uid: job.uid,
					state: job.state,
					type: job.type,
					tags: job.tags,
					renderProgress: job.renderProgress,
					error: job.error,
					createdAt: job.createdAt,
					updatedAt: job.updatedAt,
					startedAt: job.startedAt,
					finishedAt: job.finishedAt,
					errorAt: job.errorAt,
					jobCreator: job.creator,
					jobExecutor: job.executor
				});
			}

			return result;
		}
	}
}