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


const app = express();

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



app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    service: "Atlas API",
    timestamp: new Date().toISOString(),
  });
});

export default app;