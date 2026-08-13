import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// console.log("SUPABASE_URL:", env.SUPABASE_URL);
// console.log(
//   "SERVICE ROLE EXISTS:",
//   !!env.SUPABASE_SERVICE_ROLE_KEY
// );