import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
