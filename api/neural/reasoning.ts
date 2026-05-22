import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
app.use(express.json());

app.post("/api/neural/reasoning", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
       return res.status(500).json({ error: "Neural link missing OPENROUTER_API_KEY" });
    }

    const openrouter = new OpenRouter({ apiKey });

    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openrouter.chat.send({
      model: model || "google/gemma-4-31b-it:free",
      messages: [{ role: "user", content: prompt }],
      stream: true
    });

    for await (const chunk of (stream as any)) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(`data: ${JSON.stringify({ content: chunk.choices[0].delta.content, usage: chunk.usage })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error("[Neural Error]:", error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default app;
