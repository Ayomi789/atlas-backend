import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);




export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Verify your Atlas account",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up for Atlas. Click the link below to verify your email address:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your Atlas password",
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

// export async function sendVerificationEmail(to: string, name: string, token: string) {
//   const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

//   await resend.emails.send({
//     from: env.EMAIL_FROM,
//     to,
//     subject: "Verify your Atlas account",
//     html: `
//       <p>Hi ${name},</p>
//       <p>Thanks for signing up for Atlas. Click the link below to verify your email address:</p>
//       <p><a href="${link}">${link}</a></p>
//       <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
//     `,
//   });
// }

// export async function sendPasswordResetEmail(to: string, name: string, token: string) {
//   const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

//   await resend.emails.send({
//     from: env.EMAIL_FROM,
//     to,
//     subject: "Reset your Atlas password",
//     html: `
//       <p>Hi ${name},</p>
//       <p>We received a request to reset your password. Click the link below to choose a new one:</p>
//       <p><a href="${link}">${link}</a></p>
//       <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
//     `,
//   });
// }