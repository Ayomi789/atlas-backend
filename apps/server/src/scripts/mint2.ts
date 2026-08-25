import jwt from "jsonwebtoken";
import prisma from "../config/db";
async function main() {
  const user = await prisma.user.findFirst({ where: { emailVerified: true }, orderBy: { createdAt: "desc" } });
  const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: "desc" } });
  const token = jwt.sign({ userId: user!.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  console.log("TOKEN=" + token);
  console.log("WS=" + ws!.id);
}
main().then(() => process.exit(0));
