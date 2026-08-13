import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { list, markRead, markAllRead } from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticate, list);
router.patch("/read-all", authenticate, markAllRead);
router.patch("/:id/read", authenticate, markRead);

export default router;