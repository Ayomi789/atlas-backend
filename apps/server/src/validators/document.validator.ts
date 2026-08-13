import { z } from "zod";

export const createDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),

  storageKey: z.string().min(1, "Storage key is required"),

  mimeType: z.string().min(1, "MIME type is required"),

  size: z.number().positive("File size must be greater than 0"),

  workspaceId: z.string().cuid("Invalid workspace ID"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;