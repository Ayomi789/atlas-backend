// Authorization test-suite for billing endpoints. Run while the backend is up:
//   node billing-auth.test.js
// Expect: members blocked from mutating billing anywhere; non-members blocked
// from everything; owners pass auth (may still fail later on business rules).
require("dotenv").config();
const jwt = require("jsonwebtoken");

const BASE = process.env.API_BASE || "http://localhost:5000";
const WS = process.env.TEST_WS || "cmsvp3whi0002lvxoca50cac7"; // free workspace (Jennifer: member)
const OTHER_WS = process.env.TEST_OTHER_WS || "cmsgmm6990001lv0s8ki529cs"; // business ws (Jennifer: NOT a member)

// Update these if you recreate the test users:
const MEMBER_ID = "cmt5tzflg0000lvyol0u2cj1h"; // Jennifer — role: member on WS
const OWNER_ID = "cmsgmm5bh0000lv0scqbrn6ob"; // abdullateef — role: owner of WS

function tokenFor(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "10m" });
}

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, message: data?.message ?? "" };
}

let failures = 0;
function check(name, result, expectStatus, expectMessagePart) {
  const ok =
    result.status === expectStatus &&
    (!expectMessagePart ||
      result.message.toLowerCase().includes(expectMessagePart.toLowerCase()));
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}  ->  ${result.status} "${result.message}"`
  );
}

(async () => {
  const member = tokenFor(MEMBER_ID);
  const owner = tokenFor(OWNER_ID);

  console.log("=== member on own workspace ===");
  check(
    "member can view own subscription",
    await call("GET", `/api/billing/${WS}/subscription`, member),
    200
  );
  check(
    "member CANNOT change plan",
    await call("POST", `/api/billing/${WS}/change-plan`, member, { plan: "team" }),
    400,
    "Only workspace owners and admins"
  );
  check(
    "member CANNOT open portal",
    await call("POST", `/api/billing/${WS}/portal`, member),
    400,
    "Only workspace owners and admins"
  );
  check(
    "member CANNOT start checkout",
    await call("POST", `/api/billing/${WS}/checkout`, member, { plan: "team" }),
    400,
    "Only workspace owners and admins"
  );

  console.log("=== member attacking a workspace they are NOT in ===");
  check(
    "non-member CANNOT view subscription",
    await call("GET", `/api/billing/${OTHER_WS}/subscription`, member),
    500,
    "Workspace not found"
  );
  check(
    "non-member CANNOT change plan",
    await call("POST", `/api/billing/${OTHER_WS}/change-plan`, member, {
      plan: "team",
    }),
    400,
    "Workspace not found"
  );
  check(
    "non-member CANNOT open portal",
    await call("POST", `/api/billing/${OTHER_WS}/portal`, member),
    400,
    "Workspace not found"
  );

  console.log("=== owner (positive control) ===");
  check(
    "owner can view subscription",
    await call("GET", `/api/billing/${WS}/subscription`, owner),
    200
  );
  check(
    "owner passes auth on change-plan (fails later: no subscription on free ws)",
    await call("POST", `/api/billing/${WS}/change-plan`, owner, { plan: "team" }),
    400,
    "No active subscription"
  );

  console.log(failures === 0 ? "\nALL PASS ✅" : `\n${failures} FAILURE(S) ❌`);
  process.exit(failures === 0 ? 0 : 1);
})();
