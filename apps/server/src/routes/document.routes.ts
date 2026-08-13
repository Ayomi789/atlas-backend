import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

import {
  createDocumentController,
  getWorkspaceDocumentsController,
  deleteDocumentController,
  uploadDocumentController,
} from "../controllers/document.controller";

const router = Router();

router.post("/", authenticate, createDocumentController);

router.get(
  "/workspace/:workspaceId",
  authenticate,
  getWorkspaceDocumentsController
);

router.delete("/:id", authenticate, deleteDocumentController);

// ⭐ Real file upload
router.post(
  "/:id/upload",
  authenticate,
  upload.single("file"),
  uploadDocumentController
);

export default router;