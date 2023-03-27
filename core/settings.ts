import "dotenv/load.ts"

export const PORT = Deno.env.get("PORT") ? Number(Deno.env.get("PORT")) : 8004

export const SECRET_KEY = Deno.env.get("SECRET_KEY")
	? Deno.env.get("SECRET_KEY")
	: "secret"
