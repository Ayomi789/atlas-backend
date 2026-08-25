import { Paddle, Environment } from "@paddle/paddle-node-sdk";

async function main() {
  const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: Environment.sandbox,
  });
  const customer = await paddle.customers.create({
    email: "lowercase-test@example.com",
    name: "Enum Test",
  });
  console.log("SUCCESS customer:", customer.id);
}
main().catch((e) => console.log("FAILED:", e.message)).finally(() => process.exit(0));
