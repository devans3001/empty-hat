import OpenAI from 'openai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	OPENAI_API_KEY: string;
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


// app.get("/chatToDoc", (c) => (
//   c.text(`${c.env.OPENAI_API_KEY ? "OpenAI API key is set." : "OpenAI API key is missing."}`)
// ))

app.post('/chatToDoc', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const docData = body.docData?.trim();
    const question = body.question?.trim();

    if (!docData || !question) {
      return c.json({ error: "Missing docData or question" }, 400);
    }

    console.log("📩 Incoming:", { docData, question });

    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can safely use "gpt-4o" too
      messages: [
        { role: "system", content: `Document: ${docData}` },
        { role: "user", content: question },
      ],
      temperature: 0.3,
    });

    const reply = response.choices?.[0]?.message?.content ?? "No response.";

    return c.json({ message: reply });
  } catch (err) {
    console.error("🔥 chatToDoc error:", err);
    return c.json({ error: err.message || "Internal error" }, 500);
  }
});

app.get("/test-key", async (c) => {
   c.text(`${c.env.OPENAI_API_KEY ? "OpenAI API key is set." : "OpenAI API key is missing."}`)
  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  try {
    const res = await openai.models.list();
    return c.json({ success: true, models: res.data.map(m => m.id) });
  } catch (err) {
    console.error("❌ API key test failed:", err);
    return c.json({ error: err.message }, 500);
  }
});



// new one

// app.post('/chatToDoc', async (c) => {
//   try {
//     const { docData, question } = await c.req.json();

//     const payload = {
//       model: 'gpt-4.1', // ✅ must be valid
//       temperature: 0.5,
//       messages: [
//         { role: 'system', content: `Doc: ${docData}` },
//         { role: 'user', content: `Q: ${question}` },
//       ],
//     };

//     const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
//       },
//       body: JSON.stringify(payload),
//     });

//     const text = await openaiRes.text();

//     if (!openaiRes.ok) {
//       console.error("❌ OpenAI API Error:", text);
//       return c.json({ error: `OpenAI API failed: ${c.env.OPENAI_API_KEY}`, detail: text }, 500);
//     }

//     let content = "No response.";
//     try {
//       const json = JSON.parse(text);
//       content = json.choices?.[0]?.message?.content ?? "No response.";
//     } catch (e) {
//       console.error("❌ Failed to parse JSON:", e);
//     }

//     return c.json({ message: content });
//   } catch (err) {
//     console.error("🔥 Error in /chatToDoc:", err);
//     return c.json({ error: "Internal Server Error" }, 500);
//   }
// });





export default app;
