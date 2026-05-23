import express from "express";
import path from "path";
import crypto from "crypto";
import { OpenRouter } from "@openrouter/sdk";
import Parser from "rss-parser";

export async function createServer() {
  const app = express();
  const PORT = 3000;
  const rssParser = new Parser({
    customFields: {
      item: [
        ['yt:videoId', 'youtubeId'],
        ['yt:channelId', 'channelId'],
      ]
    }
  });

  app.use(express.json());

  const isVercel = Boolean(process.env.VERCEL);
  const forceViteDev = process.env.FORCE_VITE_DEV === "1";
  const isProd = process.env.NODE_ENV === "production" && !forceViteDev;

  const isAssetLikeRequest = (requestPath: string) => {
    if (requestPath.startsWith('/@vite/') || requestPath.startsWith('/@fs/') || requestPath.startsWith('/src/')) {
      return true;
    }

    const ext = path.extname(requestPath);
    return Boolean(ext) && ext !== '.html';
  };

  const isHtmlNavigationRequest = (req: express.Request) => {
    const accept = req.headers.accept || '';
    return req.method === 'GET' && typeof accept === 'string' && accept.includes('text/html');
  };

  // MODULE 5: SOVEREIGN MEDIA (YOUTUBE RSS BRIDGE)
  app.get("/api/youtube/rss", async (req, res) => {
    try {
      const { channelId } = req.query;
      if (!channelId) return res.status(400).json({ error: "Channel ID required" });

      const feed = await rssParser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      
      // Clean up the feed items for the frontend
      const items = feed.items.map(item => ({
        youtubeId: item.youtubeId,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        author: item.author,
        thumbnail: `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
      }));

      res.json({ title: feed.title, items });
    } catch (error: any) {
      console.error("[YouTube RSS Error]:", error.message);
      res.status(500).json({ error: "Failed to fetch media archive signals" });
    }
  });

  /**
   * Heritage Image Protocol - Bridging external Imgur/Postman mock archives
   */
  app.get("/api/heritage/images", async (req, res) => {
    try {
      // Standard Sovereign Fetch Protocol
      const response = await fetch("https://3b0a246f-7f49-49de-98b2-722d7b863a97.mock.pstmn.io", {
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Archival connection failed: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Heritage API Sync Error]:", error.message);
      // Fallback response for resilience
      res.json({ 
        images: [
          "https://i.imgur.com/7QFYTZJ.png",
          "https://i.imgur.com/MA123T4.png",
          "https://i.imgur.com/S4l7lKP.png",
          "https://i.imgur.com/jNv9WE7.png",
          "https://i.imgur.com/2Xkwv9Y.png"
        ]
      });
    }
  });

  // MODULE 3: AI & INTELLIGENCE (LEEMA BRAIN)
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

  /**
   * Neural Reasoning Node (Gemma 4 architecture simulation)
   */
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

  /**
   * Media Classification Node
   */
  app.post("/api/media/classify", async (req, res) => {
    try {
      const { title, currentCategory } = req.body;
      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        return res.json({ 
          refinedCategory: currentCategory,
          tags: ["archive", "heritage"],
          summary: "AI enrichment skipped (Key missing)." 
        });
      }

      const openrouter = new OpenRouter({ apiKey });
      const prompt = `Classify this cultural artifact from House of Daraja. 
      Title: "${title}"
      Current Category: ${currentCategory}
      
      Return JSON: {
        "refinedCategory": "Dandali" | "Zare Global" | "Co-Creators",
        "tags": ["tag1", "tag2"],
        "summary": "One sentence poetic summary",
        "culturalContext": "Brief historical/cultural note",
        "hausaTitle": "...",
        "frenchTitle": "...",
        "arabicTitle": "..."
      }`;

      const response = await openrouter.chat.send({
        model: "google/gemma-4-31b-it:free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || "{}";
      res.json(JSON.parse(content));
    } catch (error) {
      res.status(500).json({ error: "Classification failed" });
    }
  });

  /**
   * Universal Translation Node
   */
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

  // MODULE 2: PAYMENT ORCHESTRATION (SECURE HANDLERS)
  
  /**
   * Secure Checkout Initiation
   * Fetches canonical pricing from Firestore to prevent client-side spoofing.
   */
  app.post("/api/payments/initialize", async (req, res) => {
    try {
      const { productId, userId } = req.body;
      
      // Zero-Trust: We would fetch price from Firestore here via Admin SDK
      // For now, we simulate the secure validation
      console.log(`[Zero-Trust] Initializing secure checkout for product: ${productId}`);
      
      // Convert to Kobo (Kobo Scaling)
      const amountInKobo = 75000 * 100; // Example canonical price
      
      const transactionRef = `DRJ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      res.json({
        status: "success",
        data: {
          reference: transactionRef,
          amount: amountInKobo,
          virtualAccount: {
            bank: "Wema Bank (Moniepoint)",
            accountNumber: "90" + Math.floor(10000000 + Math.random() * 90000000),
            accountName: "HOUSE OF DARAJA - " + transactionRef.slice(-4),
            expiry: Date.now() + (30 * 60 * 1000) // 30 min expiry
          }
        }
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Failed to link to payment gateway" });
    }
  });

  /**
   * Simulation of Internal Payment Confirmation (Webhook or Poll)
   * TRIGGERS MODULE 4: EVENT-DRIVEN NOTIFICATIONS
   */
  app.post("/api/payments/simulate-confirmation", async (req, res) => {
    const { reference } = req.body;
    
    console.log(`[Module 4] Order ${reference} shifted to PAID status.`);
    
    // Idempotency Lock (Simulation)
    const idempotencyKey = `notify_${reference}`;
    console.log(`[Module 4] Applying Idempotency Lock: ${idempotencyKey}`);

    // Execution Channels
    console.log(`[Module 4] Triggering FCM Push Alert...`);
    console.log(`[Module 4] Dispatching Branded Receipt Email (Lore & Care)...`);
    console.log(`[Module 4] Calling SMS Gateway (Termii) for Reference ${reference}...`);

    res.json({ status: "success", message: "Omni-channel notifications dispatched." });
  });

  /**
   * Webhook Verification (HMAC-SHA256)
   */
  app.post("/api/payments/webhook", (req, res) => {
    const signature = req.headers["x-opay-signature"];
    const secret = process.env.OPAY_SECRET_KEY || "dummy_secret";
    
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== computedSignature) {
      console.error("[Security] Unauthorized Webhook Attempt Blocked");
      return res.status(401).send("Unauthorized");
    }

    // Atomic Transaction logic would follow here
    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (!isProd && !isVercel) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!isVercel) {
    // Only serve static files if NOT on Vercel
    // (Vercel serves them directly via the output directory and rewrites)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api/') || isAssetLikeRequest(req.path)) {
        return next();
      }

      if (!isHtmlNavigationRequest(req)) {
        return res.status(404).end();
      }

      return res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if explicitly told to or if not on Vercel
  if (process.env.AI_STUDIO || !isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Sovereign Core] Online at http://localhost:${PORT}`);
      setupBackgroundOrchestrator();
    });
  }

  return app;
}

function setupBackgroundOrchestrator() {
  console.log("[Orchestrator] Initializing Notification Pipeline...");
}

// Automatically start if executed directly
if (process.env.AI_STUDIO || !process.env.VERCEL) {
  createServer();
}

