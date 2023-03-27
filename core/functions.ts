import { parse, stringify } from "std/encoding/toml.ts"

import { Router } from "oak/mod.ts"

import { z } from "npm:zod"

import type { Context } from "oak/mod.ts"

import type { FunctionToml } from "core/types.ts"

export const core_router = new Router()

core_router.prefix("/functions-management")

const schema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	folder: z.string().optional().default("root"),
})

core_router.post("/create", async ({ request, response }: Context) => {
	const body = request?.body()

	if (body.type !== "json") {
		response.status = 400
		response.body = "Invalid body type, expected JSON"
	}

	const data = await body.value

	const result = schema.safeParse(data)

	if (!result.success) {
		response.status = 400
		return response.body = result.error.issues
	}

	const { name, code, folder } = result.data

	const toml_result = await Deno.readTextFile("functions.toml")

	const _toml = parse(toml_result)

	const functions = _toml.functions as FunctionToml[] ?? []

	if (
		functions.find((fn: FunctionToml) =>
			fn.name === name && fn.folder === folder
		)
	) {
		response.status = 400
		return response.body = "Function already exists"
	}

	functions.push({ name, folder, code })

	_toml.functions = functions

	Deno.writeTextFile("functions.toml", stringify(_toml))

	if (folder === "root") Deno.writeTextFile(`./functions/${name}.ts`, code)
	else {
		Deno.mkdirSync(`./functions/${folder}`, { recursive: true })

		Deno.writeTextFile(`./functions/${folder}/${name}.ts`, code)
	}

	response.status = 200

	return response.body = "Function has been created"
})

core_router.get("/list", async ({ request, response }: Context) => {
	const folder = request.url.searchParams.get("folder") ?? "all"

	const result = await Deno.readTextFile("functions.toml")

	const _toml = parse(result)

	const functions = _toml.functions as FunctionToml[]

	const _functions = []

	for (const fn of functions) {
		if (folder === "all") _functions.push(fn?.name)

		if (fn?.folder === folder) _functions.push(fn?.name)
	}

	response.status = 200

	return response.body = _functions
})

core_router.get("/get/:name", async ({ params, request, response }) => {
	const { name } = params

	const folder = request.url.searchParams.get("folder") ?? "root"

	const path = folder === "root"
		? `./functions/${name}.ts`
		: `./functions/${folder}/${name}.ts`

	try {
		const code = await Deno.readTextFile(path)

		response.status = 200

		return response.body = code
	} catch {
		response.status = 404

		return response.body = "Function not found"
	}
})

core_router.post("/update", async ({ request, response }: Context) => {
	const body = request?.body()

	if (body.type !== "json") {
		response.status = 400
		response.body = "Invalid body type, expected JSON"
	}

	const data = await body.value

	const result = schema.safeParse(data)

	if (!result.success) {
		response.status = 400
		return response.body = result.error.issues
	}

	const { name, code, folder } = result.data

	const toml_result = await Deno.readTextFile("functions.toml")

	const _toml = parse(toml_result)

	const functions = _toml.functions as FunctionToml[] ?? []

	const path = folder === "root"
		? `./functions/${name}.ts`
		: `./functions/${folder}/${name}.ts`
	console.log(path)
	try {
		await Deno.stat(path)
	} catch {
		response.status = 404
		return response.body = "Function not found"
	}

	Deno.writeTextFile(path, code)

	for (const fn of functions) {
		if (fn.name === name && fn.folder === folder) {
			fn.code = code
		}
	}

	_toml.functions = functions

	Deno.writeTextFile("functions.toml", stringify(_toml))

	response.status = 200

	return response.body = "Function has been updated"
})

core_router.post("/delete", async ({ request, response }: Context) => {
	const body = request?.body()

	if (body.type !== "json") {
		response.status = 400
		response.body = "Invalid body type, expected JSON"
	}

	const data = await body.value

	if (!data.name) {
		response.status = 400

		return response.body = "No name provided"
	}

	const { name, folder = "root" } = data

	const result = await Deno.readTextFile("functions.toml")

	const _toml = parse(result)

	const functions = _toml.functions as FunctionToml[] ?? []

	const path = folder === "root"
		? `./functions/${name}.ts`
		: `./functions/${folder}/${name}.ts`

	try {
		await Deno.stat(path)
	} catch {
		response.status = 404
		return response.body = "Function not found"
	}

	Deno.remove(path)

	const non_folder_functions = functions.filter((fn: FunctionToml) =>
		fn.folder !== folder
	)

	const folder_functions = functions.filter((fn: FunctionToml) => {
		if (fn.folder === folder) {
			if (fn.name === name) return false
			else return true
		} else return false
	})

	_toml.functions = [...non_folder_functions, ...folder_functions]

	Deno.writeTextFile("functions.toml", stringify(_toml))

	response.status = 200

	return response.body = "Function has been deleted"
})
