import { Request, Response } from "express";

import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  deleteAccount,
  updateProfile,
  signInWithGoogle,
} from "../services/auth.service";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validator";

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
}



export async function me(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
}


export async function verifyEmailController(req: Request, res: Response) {
  try {
    const data = verifyEmailSchema.parse(req.body);
    const result = await verifyEmail(data.token);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function resendVerificationController(req: Request, res: Response) {
  try {
    const data = resendVerificationSchema.parse(req.body);
    const result = await resendVerificationEmail(data.email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordReset(data.email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(data.token, data.password);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function deleteAccountController(req: Request, res: Response) {
  try {
    const result = await deleteAccount(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}


export async function updateProfileController(req: Request, res: Response) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.user.id, data);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}


export async function googleAuthController(req: Request, res: Response) {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Missing Google credential",
      });
    }

    const result = await signInWithGoogle(credential);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? `Google sign-in failed: ${error.message}`
          : "Google sign-in failed",
    });
  }
}