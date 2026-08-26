import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { invite, list, accept, cancel, resend } from "../controllers/invite.controller";

const router = Router({ mergeParams: true });

// Accept is the only public-by-token invite action — still requires auth (logged-in user whose email matches).
router.post("/accept/:token", authenticate, accept);

// Workspace-scoped invite management (owner/admin via service).
router.post("/", authenticate, invite);
router.get("/", authenticate, list);
router.delete("/:inviteId", authenticate, cancel);
router.post("/:inviteId/resend", authenticate, resend);

export default router;
