import { Application, Router } from "oak/mod.ts"

import { PORT } from "core/settings.ts"
import { restore } from "core/helper.ts"
import { core_router } from "core/functions.ts"

const app = new Application()

const router = new Router()

Deno.mkdirSync("./functions", { recursive: true })

await restore()

/**
 * Load a function route
 *
 * @param name - The name of the function
 *
 * @param item - The file item
 *
 * @param sub_dir - Whether the function is in a sub directory
 */
async function load_fn_route(
	name: string,
	item: Deno.DirEntry,
	sub_dir = false,
) {
	let fn

	if (sub_dir) {
		const _default = await import(
			`./functions/${item.name}/${name}.ts`
		)
		fn = _default.default
	} else {
		const _default = await import(`./functions/${name}.ts`)
		fn = _default.default
	}

	if (!sub_dir && fn && typeof fn === "function") router.all(`/${name}`, fn)
	if (sub_dir && fn && typeof fn === "function") {
		router.all(`/${item.name}/${name}`, fn)
	}
}

for await (const item of Deno.readDir("functions")) {
	if (item.isFile) {
		const name: string = item.name.split(".")[0]

		load_fn_route(name, item)
	} else {
		for await (const subitem of Deno.readDir(`functions/${item.name}`)) {
			if (subitem.isFile) {
				const name: string = subitem.name.split(".")[0]

				load_fn_route(name, item, true)
			}
		}
	}
}

router.use(core_router.routes())

router.use(core_router.allowedMethods())

app.use(router.routes())

app.use(router.allowedMethods())

await app.listen({ port: PORT })
