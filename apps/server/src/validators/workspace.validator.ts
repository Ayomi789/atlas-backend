import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
  description: z.string().optional(),
});

export type CreateWorkspaceInput = z.infer<
  typeof createWorkspaceSchema
>;


export const updateWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required").optional(),
  description: z.string().optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;