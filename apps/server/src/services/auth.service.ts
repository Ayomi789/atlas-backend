
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

import prisma from "../config/db";
import { RegisterInput, LoginInput, UpdateProfileInput } from "../validators/auth.validator";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const verificationToken = generateToken();

const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (err) {
    await prisma.user.delete({ where: { id: user.id } });
    throw new Error(
      "We couldn't send the verification email, so registration wasn't completed. Please try again."
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

   const token = jwt.sign(
    {
      userId: user.id,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    throw new Error("This verification link is invalid or has expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return { message: "Email verified successfully" };
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    return { message: "If that account exists and needs verifying, an email has been sent" };
  }

  const verificationToken = generateToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  await sendVerificationEmail(user.email, user.name, verificationToken);

  return { message: "If that account exists and needs verifying, an email has been sent" };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: "If that account exists, a reset link has been sent" };
  }

  const resetToken = generateToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: "If that account exists, a reset link has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw new Error("This reset link is invalid or has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { message: "Password reset successfully" };
}


export async function deleteAccount(userId: string) {
  const ownedMemberships = await prisma.workspaceMember.findMany({
    where: { userId, role: "owner" },
    include: {
      workspace: {
        include: { members: true },
      },
    },
  });

  const blockingWorkspaces = ownedMemberships.filter(
    (m) => m.workspace.members.length > 1
  );

  if (blockingWorkspaces.length > 0) {
    const names = blockingWorkspaces.map((m) => m.workspace.name).join(", ");
    throw new Error(
      `You own workspace(s) with other members: ${names}. Transfer ownership or remove other members before deleting your account.`
    );
  }

  const soloWorkspaceIds = ownedMemberships
    .filter((m) => m.workspace.members.length === 1)
    .map((m) => m.workspaceId);

  if (soloWorkspaceIds.length > 0) {
    await prisma.workspace.deleteMany({
      where: { id: { in: soloWorkspaceIds } },
    });
  }

  await prisma.user.delete({ where: { id: userId } });

  return { message: "Account deleted successfully" };
}


export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };
}