import { Router } from "express";

import {
  create,
  list,
  getOne,
  remove,
  update,
} from "../controllers/conversation.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);
router.get("/", authenticate, list);
router.delete("/:id", authenticate, remove);
router.patch("/:id", authenticate, update);

export default router;