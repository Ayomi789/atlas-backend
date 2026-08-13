import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { listWorkspaceActivity } from "../controllers/notification.controller";

// mounted at /api/workspaces/:workspaceId/activity
const router = Router({ mergeParams: true });

router.get("/", authenticate, listWorkspaceActivity);

export default router;