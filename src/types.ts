export interface Env {
	DATABASE: DurableObjectNamespace
}

type RenderState = "setup" | "predownload" | "download" | "postdownload" | "prerender" | "script" | "dorender" | "postrender" | "cleanup";
type JobState = "created" | "queued" | "picked" | "started" | `render:${RenderState}` | "finished" | "error";

interface Template{
	src: string
	composition: string

	frameStart?: number
    frameEnd?: number
    frameIncrement?: number

    continueOnMissing?: boolean
    settingsTemplate?: string
    outputModule?: string
    outputExt?: string
    imageSequence?: boolean
}

type AssetType = "image" | "audio" | "video" | "data" | "script" | "static";

interface Asset{
	type: AssetType
	src?: string
	layerName: string
	layerIndex?: number
	composition?: string
	name?: string
	extension?: string
	useOriginal?: boolean
	property?: string
	value?: string
}

interface Actions {
	predownload?: Action[]
	postdownload?: Action[]
	prerender?: Action[]
	postrender?: Action[]
}

interface Action {
	module: string
	input?: string
	output?: string
	preset?: string
	provider?: string
	params?: unknown
}

export interface NexrenderJob{
	uid: string
	type: string
	state: JobState
	output: string
	priority: number
	tags: string
	renderProgress: number
	template: Template
	assets: Asset[]
	actions: Actions
	createdAt: string
	updatedAt: string
	startedAt: string
	finishedAt: string
	errorAt: string
	creator: string // IP address
	executor: string // IP address
	error: string[]
}

export interface NexrenderStatus{
	uid: string
	state: JobState
	type: string
	tags: string
	renderProgress: number
	error: string[]
	createdAt: string
	updatedAt: string
	startedAt: string
	finishedAt: string
	errorAt: string
	jobCreator: string // IP address
	jobExecutor: string // IP address
}