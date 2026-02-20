import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { loadEnv } from "./lib/env.js";
import { ownerMiddleware } from "./middleware/owner.js";

import { bootstrapRouter } from "./routes/bootstrap.js";
import { journalsRouter } from "./routes/journals.js";
import { entriesRouter } from "./routes/entries.js";
import { uploadRouter } from "./routes/upload.js";
import { previewRouter } from "./routes/preview.js";
import { approveRouter } from "./routes/approve.js";
import { shareRouter } from "./routes/share.js";

const env = loadEnv();
const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));

app.use("/storage", express.static(path.resolve(env.STORAGE_DIR)));

app.use(ownerMiddleware);

app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/journals", journalsRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/preview", previewRouter);
app.use("/api/approve", approveRouter);
app.use("/api/share", shareRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(3001, () => console.log("API running on http://localhost:3001"));
