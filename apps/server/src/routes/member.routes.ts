import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { list, invite, updateRole, remove } from "../controllers/member.controller";

// mounted at /api/workspaces/:workspaceId/members
const router = Router({ mergeParams: true });

router.get("/", authenticate, list);
router.post("/", authenticate, invite);
router.patch("/:memberId", authenticate, updateRole);
router.delete("/:memberId", authenticate, remove);

export default router;
