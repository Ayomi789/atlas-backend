import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import {
  getSubscription,
  startCheckout,
  startPortal,
  changePlan,
  reconcileSeats,
} from "../controllers/billing.controller";

const router = Router();

router.get("/:workspaceId/subscription", authenticate, getSubscription);
router.post("/:workspaceId/checkout", authenticate, startCheckout);
router.post("/:workspaceId/portal", authenticate, startPortal);
router.post("/:workspaceId/change-plan", authenticate, changePlan);
// Cron-triggered seat reconciliation — guarded by x-cron-secret, not a JWT.
router.post("/reconcile-seats", reconcileSeats);

export default router;