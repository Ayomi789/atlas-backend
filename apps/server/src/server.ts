import dotenv from "dotenv";

import app from "./app";
import { env } from "./config/env";

dotenv.config();

app.listen(env.PORT, () => {
  console.log(`🚀 Atlas API running on port ${env.PORT}`);
});