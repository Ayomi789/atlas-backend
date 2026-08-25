import prisma from "../config/db";
async function main() {
  const u = await prisma.user.findUnique({ where: { email: "routing.test.1787496766@example-work.com" } });
  console.log("VT=" + (u?.verificationToken ?? "none"));
}
main().then(() => process.exit(0));
