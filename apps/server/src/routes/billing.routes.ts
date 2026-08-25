import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import {
  getSubscription,
  startCheckout,
  startPortal,
  changePlan, 
} from "../controllers/billing.controller";

const router = Router();

router.get("/:workspaceId/subscription", authenticate, getSubscription);
router.post("/:workspaceId/checkout", authenticate, startCheckout);
router.post("/:workspaceId/portal", authenticate, startPortal);
router.post("/:workspaceId/change-plan", authenticate, changePlan);

export default router;