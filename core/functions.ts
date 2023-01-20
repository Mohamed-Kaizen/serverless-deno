import {
	parse,
	stringify,
} from "https://deno.land/std@0.173.0/encoding/toml.ts";

import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import type { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";

export const core_router = new Router();

core_router.prefix("/functions-management");

interface FunctionToml {
	name: string;

	code: string;
}

core_router.post("/create", async ({ request, response }: Context) => {
	const body = request?.body();

	if (body.type !== "json") {
		response.status = 400;
		response.body = "Invalid body type, expected JSON";
	}

	const data = await body.value;

	if (!data.name) {
		response.status = 400;

		return response.body = "No name provided";
	}

	if (!data.code) {
		response.status = 400;
		return response.body = "No code provided";
	}

	const { name, code } = data;

	const result = await Deno.readTextFile("functions.toml");

	const _toml = parse(result);

	const functions = _toml.functions as FunctionToml[] ?? [];

	if (functions.find((fn: FunctionToml) => fn.name === name)) {
		response.status = 400;
		return response.body = "Function already exists";
	}

	functions.push({ name, code });

	_toml.functions = functions;

	Deno.writeTextFile("functions.toml", stringify(_toml));

	Deno.writeTextFile(`./functions/${name}.ts`, code);

	response.status = 200;

	return response.body = "Function has been created";
});

core_router.get("/list", async ({ response }: Context) => {
	const result = await Deno.readTextFile("functions.toml");

	const _toml = parse(result);

	const functions = _toml.functions as FunctionToml[];

	const _functions = [];

	for (const fn of functions) {
		_functions.push(fn?.name);
	}

	response.status = 200;

	return response.body = _functions;
});

core_router.get("/get/:name", async ({ params, response }) => {
	const { name } = params;

	try {
		const code = await Deno.readTextFile(`./functions/${name}.ts`);

		response.status = 200;

		return response.body = code;
	} catch {
		response.status = 404;

		return response.body = "Function not found";
	}
});

core_router.post("/update", async ({ request, response }: Context) => {
	const body = request?.body();

	if (body.type !== "json") {
		response.status = 400;
		response.body = "Invalid body type, expected JSON";
	}

	const data = await body.value;

	if (!data.name) {
		response.status = 400;

		return response.body = "No name provided";
	}

	if (!data.code) {
		response.status = 400;
		return response.body = "No code provided";
	}

	const { name, code } = data;

	const result = await Deno.readTextFile("functions.toml");

	const _toml = parse(result);

	const functions = _toml.functions as FunctionToml[] ?? [];

	try {
		await Deno.stat(`./functions/${name}.ts`);
	} catch {
		response.status = 404;
		return response.body = "Function not found";
	}

	Deno.writeTextFile(`./functions/${name}.ts`, code);

	for (const fn of functions) {
		if (fn.name === name) {
			fn.code = code;
		}
	}

	_toml.functions = functions;

	Deno.writeTextFile("functions.toml", stringify(_toml));

	response.status = 200;

	return response.body = "Function has been updated";
});

core_router.post("/delete", async ({ request, response }: Context) => {
	const body = request?.body();

	if (body.type !== "json") {
		response.status = 400;
		response.body = "Invalid body type, expected JSON";
	}

	const data = await body.value;

	if (!data.name) {
		response.status = 400;

		return response.body = "No name provided";
	}

	const { name } = data;

	const result = await Deno.readTextFile("functions.toml");

	const _toml = parse(result);

	const functions = _toml.functions as FunctionToml[] ?? [];

	try {
		await Deno.stat(`./functions/${name}.ts`);
	} catch {
		response.status = 404;
		return response.body = "Function not found";
	}

	Deno.remove(`./functions/${name}.ts`);

	_toml.functions = functions.filter((fn: FunctionToml) => fn.name !== name);

	Deno.writeTextFile("functions.toml", stringify(_toml));

	response.status = 200;

	return response.body = "Function has been deleted";
});
