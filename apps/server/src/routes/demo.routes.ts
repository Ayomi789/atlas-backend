import { Router } from "express";

import { demoLimiter } from "../middleware/rate-limit.middleware";
import { demoAsk } from "../controllers/demo.controller";

const router = Router();

router.post("/ask", demoLimiter, demoAsk);

export default router;