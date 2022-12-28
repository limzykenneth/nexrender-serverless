export interface Env {
	DATABASE: DurableObjectNamespace
}

type RenderState = "setup" | "predownload" | "download" | "postdownload" | "prerender" | "script" | "dorender" | "postrender" | "cleanup";
type JobState = "created" | "queued" | "picked" | "started" | `render:${RenderState}` | "finished" | "error";

interface Template{
	src: string
	composition: string

	// frameStart: undefined
    // frameEnd: undefined
    // frameIncrement: undefined

    // continueOnMissing: false
    // settingsTemplate: undefined
    // outputModule: undefined
    // outputExt: undefined
    // imageSequence: false
}

export interface NexrenderJob{
	uid: string
	type: string
	state: JobState
	output: string
	priority: number
	renderProgress: number
	template: Template
	createdAt: string
	updatedAt: string,
	startedAt: string
	finishedAt: string
	errorAt: string
}

export interface NexrenderStatus{
	uid: string
	state: JobState
	type: string
	// tags: job.tags || null
	renderProgress: number
	// error: job.error || null
	createdAt: string
	updatedAt: string
	startedAt: string
	finishedAt: string
	errorAt: string
	// jobCreator: job.creator
	// jobExecutor: job.executor || null
}