import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || "5000",

  DATABASE_URL: process.env.DATABASE_URL!,

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  OPENROUTER_BASE_URL:
    process.env.OPENROUTER_BASE_URL ||
    "https://openrouter.ai/api/v1",
  OPENROUTER_MODEL:
    process.env.OPENROUTER_MODEL ||
    "moonshotai/kimi-k2",

  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,

  GEMINI_CHAT_MODEL:
    process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash",

  GEMINI_EMBEDDING_MODEL:
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",

  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  EMAIL_FROM: process.env.EMAIL_FROM || "onboarding@resend.dev",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  NODE_ENV: process.env.NODE_ENV || "development",
  //   STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  // STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  // STRIPE_TEAM_PRICE_ID: process.env.STRIPE_TEAM_PRICE_ID!,
  // STRIPE_BUSINESS_PRICE_ID: process.env.STRIPE_BUSINESS_PRICE_ID!,
  PADDLE_API_KEY: process.env.PADDLE_API_KEY!,
  PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET!,
  PADDLE_TEAM_PRICE_ID: process.env.PADDLE_TEAM_PRICE_ID!,
  PADDLE_BUSINESS_PRICE_ID: process.env.PADDLE_BUSINESS_PRICE_ID!,
  PADDLE_ENVIRONMENT: process.env.PADDLE_ENVIRONMENT || "sandbox",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  DEMO_WORKSPACE_ID: process.env.DEMO_WORKSPACE_ID || "",
};