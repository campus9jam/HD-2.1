import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
app.use(express.json());

app.post("/api/translate", async (req, res) => {
  try {
    const { title, description, targetLang } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.json({ title, description, luxury_quality_score: 0 });
    }

    const prompt = `Translate to ${targetLang} in a luxury tone:
    Title: ${title}
    Description: ${description}
    Return JSON: { "title": "...", "description": "...", "luxury_quality_score": 0.95 }`;

    const openrouter = new OpenRouter({ apiKey });
    const response = await openrouter.chat.send({
      model: "google/gemma-7b-it:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    res.json(JSON.parse(content));
  } catch (error) {
     res.status(500).json({ error: "Translation failed" });
  }
});

export default app;
