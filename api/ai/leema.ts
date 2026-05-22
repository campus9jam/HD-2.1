import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
app.use(express.json());

app.post("/api/ai/leema", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing from environment");
    }

    const openrouter = new OpenRouter({ apiKey });

    const response = await openrouter.chat.send({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        ...messages
      ]
    });

    if (response.usage) {
      console.log(`[Leema Intelligence] Reasoning Tokens: ${(response.usage as any).reasoning_tokens || "N/A"}`);
    }

    const aiText = response.choices[0]?.message?.content || "";
    res.json({ text: aiText });
  } catch (error: any) {
    console.error("[Leema Brain Error]:", error.message);
    res.status(500).json({
      error: "Brain resonance lost",
      message: error.message
    });
  }
});

export default app;
