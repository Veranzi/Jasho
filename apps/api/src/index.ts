import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import { initFirebaseAdmin } from "./lib/firebase";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { txRouter } from "./routes/transactions";
import { securityRouter } from "./routes/security";
import { aiRouter } from "./routes/ai";
import { chatbotRouter } from "./routes/chatbot";
import { blockchainRouter } from "./routes/blockchain";
import { heatmapRouter } from "./routes/heatmap";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(helmet());
app.use(bodyParser.json({ limit: "8mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

initFirebaseAdmin();

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/transactions", txRouter);
app.use("/security", securityRouter);
app.use("/ai", aiRouter);
app.use("/chatbot", chatbotRouter);
app.use("/blockchain", blockchainRouter);
app.use("/heatmap", heatmapRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on :${port}`));
