/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from "openai";
import { Hono } from "hono";
import {cors} from "hono/cors";



type Bindings = {
  OPENAI_API_KEY: string;
  AI:Ai
}

const app = new Hono<{Bindings:Bindings}>();


app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST","OPTIONS","PUT"],
  allowHeaders: ["Content-Type", "Authorization","X-Custom-Header"],
  credentials: true,
  maxAge: 600,
exposeHeaders: ["Content-Length", "X-Request-ID"],

}));

app.post("/translateDocument", async (c) => {
  const { docData, targetLanguage } = await c.req.json();

  const sum = await c.env.AI.run("@cf/facebook/bart-large-cnn",{
	input_text: docData,
	max_length: 1024,
  })

  const response = await c.env.AI.run("@cf/meta/m2m100-1.2b", {
	text:sum.summary,
	source_lang:"english",
	target_lang: targetLanguage,
  })

  return new Response(JSON.stringify(response))

})

export default app;