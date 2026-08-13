import { z } from "zod";

export const createConversationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title is too long")
    .optional(),
});

export type CreateConversationInput = z.infer<
  typeof createConversationSchema
>;