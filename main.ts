import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import { PORT } from "./core/settings.ts";
import { core_router } from "./core/functions.ts";


const app = new Application();

const router = new Router();

try {
	Deno.mkdirSync("./functions");
} catch {
	// Do nothing
}

for await (const file of Deno.readDir("functions")) {
	if (file.isFile) {
		const name: string = file.name.split(".")[0];

		const { default: fn } = await import(`./functions/${name}.ts`);

		router.all(`/${name}`, fn);
	}
}

router.use(core_router.routes());

router.use(core_router.allowedMethods());

app.use(router.routes());

app.use(router.allowedMethods());

await app.listen({ port: PORT });
