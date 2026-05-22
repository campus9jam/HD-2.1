import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Express } from "express";

export function applySecurity(app: Express) {
  // 1. Enable CORS
  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? ["https://house-of-daraja.vercel.app", /\.vercel\.app$/] // Update with actual domain
      : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-OPAY-Signature"],
  }));

  // 2. Set Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable if it interferes with external assets like Imgur
  }));

  // 3. Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply limiter to all API routes
  app.use("/api/", limiter);
}
