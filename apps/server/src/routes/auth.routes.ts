import { Router } from "express";

import {
  login,
  me,
  register,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
  updateProfileController,
  googleAuthController
} from "../controllers/auth.controller";
import { deleteAccountController } from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";


const router = Router();

router.post("/register", authLimiter, register);

router.post("/login", authLimiter, login);

router.get("/me", authenticate, me);

router.post("/verify-email", verifyEmailController);
router.post("/resend-verification", authLimiter, resendVerificationController);
router.post("/forgot-password", authLimiter, forgotPasswordController);
router.post("/reset-password", authLimiter, resetPasswordController);
router.post("/google", authLimiter, googleAuthController);
router.delete("/me", authenticate, deleteAccountController);
router.patch("/me", authenticate, updateProfileController);
export default router;