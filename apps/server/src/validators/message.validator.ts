import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid("Invalid conversation ID"),

  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message is too long"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;