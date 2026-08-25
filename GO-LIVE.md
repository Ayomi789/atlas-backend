# Atlas — Paddle Go-Live Runbook

Sandbox migration is done. Live catalog exists. This is the exact cutover sequence
for when the account is verified and the domain is approved.

## Current live catalog (created Aug 2026)

| Item | Live ID |
|---|---|
| Atlas Team (product) | `pro_01m0x9svmr67y89y0cvss6mr8b` |
| Atlas Business (product) | `pro_01m0x9sw8hdstyv1k3sm5j79ys` |
| Team price ($12/user/mo) | `pri_01m0x9sxz9h4vxsdhp6wg3vebv` |
| Business price ($24/user/mo) | `pri_01m0x9sygxkghs7by4m4cvs5rd` |

## Prerequisites (do these first, in the Paddle LIVE dashboard)

- [ ] Account verification approved (Business account → verification status)
- [ ] Production domain approved (Checkout → Request domain approval)
- [ ] Payment methods enabled (Checkout → Checkout settings → Payment methods)
- [ ] Default payment link set to the production app URL (Checkout → Checkout settings)
- [ ] Bank details added (Business account → Payouts → Payout settings)
- [ ] Webhook destination created pointing at `<PROD_BACKEND_URL>/api/webhooks/paddle`
      with all subscription + transaction events — copy its signing secret

## Backend cutover (`apps/server/.env`)

```
PADDLE_API_KEY=<pdl_live_... key>          # replace sandbox key
PADDLE_WEBHOOK_SECRET=<live destination signing secret>
PADDLE_TEAM_PRICE_ID=pri_01m0x9sxz9h4vxsdhp6wg3vebv
PADDLE_BUSINESS_PRICE_ID=pri_01m0x9sygxkghs7by4m4cvs5rd
PADDLE_ENVIRONMENT=production
FRONTEND_URL=https://<production-domain>
```

Then redeploy the backend.

## Frontend cutover (`agon-agent-wired/.env`)

```
VITE_PADDLE_ENV=production
VITE_PADDLE_CLIENT_TOKEN=live_...        # live client-side token
VITE_API_URL=https://<prod-backend-url>
```

Then rebuild/redeploy the frontend. (No code changes needed — `paddle.ts` reads
`VITE_PADDLE_ENV`; `production` is Paddle.js's default environment.)

## Webhook server hardening (optional but recommended)

Allowlist only Paddle's live egress IPs before trusting `x-forwarded-for`-based
rules. Fetch the current list dynamically — never hard-code:

```
GET https://api.paddle.com/ips  →  data.ipv4_cidrs (list of /32 CIDRs)
```

Note: signature verification (`paddle.webhooks.unmarshal`) is already enforced,
which is the primary defense; IP allowlisting is defense-in-depth.

## Post-cutover smoke test (live)

1. Buy one Team subscription with a real card
2. Verify: webhook 200 in Paddle → notification log; DB row plan=team; badge updates
3. "Manage billing" opens the live portal
4. Change plan (team ↔ business) — exactly one subscription, prorated
5. Cancel — row flips to free at period end
6. Refund the test payment (Paddle → Transactions → refund)
```
