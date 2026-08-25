import fs from "fs";
import jwt from "jsonwebtoken";
import prisma from "../config/db";

async function main() {
  const user = await prisma.user.findFirst({ where: { emailVerified: true }, orderBy: { createdAt: "desc" } });
  if (!user) { console.log("NO_VERIFIED_USER"); return; }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  console.log("TOKEN=" + token);
  console.log("USER=" + user.email);
  const ws = await prisma.workspace.findMany({ select: { id: true, name: true } });
  console.log("WORKSPACES=" + JSON.stringify(ws));
}
main().then(() => process.exit(0));
