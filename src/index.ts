import OpenAI from 'openai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	OPENAI_API_KEY: string;
	GROQ_API_KEY: string;
	AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();



app.use(
	'/*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT'],
		allowHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
		credentials: true,
		maxAge: 600,
		exposeHeaders: ['Content-Length', 'X-Request-ID'],
	})
);

app.get('/', (c) => c.text('Hono AI translation server is running.'));



app.post('/translateDocument', async (c) => {
	const { docData, targetLanguage } = await c.req.json();

	const sum = await c.env.AI.run('@cf/facebook/bart-large-cnn', {
		input_text: docData,
		max_length: 1024,
	});

	const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
		text: sum.summary,
		source_lang: 'english',
		target_lang: targetLanguage,
	});

	return new Response(JSON.stringify(response));
});


app.post("/chatToDoc", async (c) => {

  
const groq = new OpenAI({
  apiKey: c.env.GROQ_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1", 
});

  try {
    const body = await c.req.json();
    const docData = body.docData?.trim();
    const question = body.question?.trim();

    if (!docData || !question) {
      return c.json({ error: "Missing docData or question" }, 400);
    }

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: "You are a assistant helping the user to chat to a document, I am providing a JSON file of the markdown for the document. Using this, answer the main question in the element way possible, the document is about " + docData },
        { role: "user", content: "My question is: "+question },
      ],
      temperature: 0.3,
    });

    const content = chat.choices?.[0]?.message?.content ?? "No response.";
    return c.json({ message: content });
  } catch (err) {
    console.error("🔥 chatToDoc error:", err);
    return c.json({ error: err.message || "Internal error" }, 500);
  }
});





export default app;
