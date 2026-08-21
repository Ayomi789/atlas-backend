import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";

import authRoutes from "./routes/auth.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import workspaceRoutes from "./routes/workspace.routes";
import documentRoutes from "./routes/document.routes";
import chatRoutes from "./routes/chat.routes";
import memberRoutes from "./routes/member.routes";
import notificationRoutes from "./routes/notification.routes";
import activityRoutes from "./routes/activity.routes";
import searchRoutes from "./routes/search.routes";

const app = express();

// Render (and most hosting platforms) sit the app behind a reverse proxy.
// Without this, req.ip always shows the proxy's address instead of the
// real visitor's — which breaks per-user rate limiting entirely.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/workspaces/:workspaceId/members", memberRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/workspaces/:workspaceId/activity", activityRoutes);
app.use("/api/search", searchRoutes);


app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    service: "Atlas API",
    timestamp: new Date().toISOString(),
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

export default app;