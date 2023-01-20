import "https://deno.land/x/dotenv@v3.2.0/load.ts";

export const PORT = Deno.env.get("PORT") ? Number(Deno.env.get("PORT")) : 8004;
