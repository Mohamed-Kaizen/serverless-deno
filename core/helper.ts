import { parse } from "std/encoding/toml.ts"

import type { FunctionToml } from "core/types.ts"

export async function restore() {
	const result = await Deno.readTextFile("functions.toml")

	const _toml = parse(result)

	const functions = _toml.functions as FunctionToml[]

	for (const fn of functions) {
		try {
			if (fn.folder === "root") {
				await Deno.stat(`./functions/${fn.name}.ts`)
			} else await Deno.stat(`./functions/${fn.folder}/${fn.name}.ts`)
		} catch {
			if (fn.folder === "root") {
				await Deno.writeTextFile(`./functions/${fn.name}.ts`, fn.code)
			} else {
				await Deno.mkdir(`./functions/${fn.folder}`, {
					recursive: true,
				})
				await Deno.writeTextFile(
					`./functions/${fn.folder}/${fn.name}.ts`,
					fn.code,
				)
			}
		}
	}
}
