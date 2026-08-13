import { Router } from "express";

import { send } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, send);

export default router;