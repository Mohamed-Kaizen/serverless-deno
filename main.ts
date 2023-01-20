import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
	parse,
	stringify,
} from "https://deno.land/std@0.173.0/encoding/toml.ts";

import { PORT } from "./core/settings.ts";
import { core_router } from "./core/functions.ts";

// const obj = {
// 	bin: [
// 		{ name: "deno", path: "cli/main.rs" },
// 		{ name: "deno_core", path: "src/foo.rs" },
// 	],
// 	nib: [{ name: "node", path: "not_found" }],
// };

// const tomlString = stringify(obj);

// console.log(tomlString);

// Deno.writeTextFile("Cargo.toml", tomlString);
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

router.get("/", (ctx) => {
	ctx.response.body = "Hello World!";
});

router.use(core_router.routes());

router.use(core_router.allowedMethods());

app.use(router.routes());

app.use(router.allowedMethods());

await app.listen({ port: PORT });
