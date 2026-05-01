# Workspace — FinWallet

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## FinWallet Mobile App

Expo (React Native) wallet app at `artifacts/mobile/`. Connects to Railway-hosted Relworx backend.

### Architecture
- **Backend URL**: `https://function-bun-production-37b5.up.railway.app` (Railway, auto-selected)
- **Auth**: Firebase phone auth (project: `livra-platform`) + 4-digit PIN (AsyncStorage)
- **Balance**: Hardcoded `LOCAL_BALANCE = 209891 UGX` (never fetched from Relworx)
- **Customer reference**: Firebase UID-based prefix via `lib/userSession.ts`

### Auth Flow
1. `app/auth/index.tsx` — phone entry (Uganda +256), fires Firebase `signInWithPhoneNumber`
2. `app/auth/otp.tsx` — 6-digit OTP verification with 60s resend countdown
3. `app/auth/pin.tsx` — 4-digit PIN numpad (mode=setup on first login, mode=verify on return)
4. `AuthGate` in `app/_layout.tsx` — redirects based on `user / hasPinSet / pinVerified`

### Key Files
- `lib/firebase.ts` — Firebase app + auth (web/native branching)
- `lib/authContext.tsx` — `AuthProvider` with `sendOtp/confirmOtp/setupPin/verifyPin/signOut`
- `lib/relworx.ts` — All Relworx API calls (products, validate, purchase, poll status)
- `lib/api.ts` — `apiFetch` wrapper pointing to Railway backend
- `lib/userSession.ts` — Firebase UID → customer_reference prefix
- `app/bank.tsx` — Bank transfer; fetches real bank list from `/api/products` (BANK_TRANSFERS)
- `app/buy.tsx` — Airtime/data purchase
- `app/pay.tsx` — Utility payments
- `app/splash.tsx` — Animated splash screen

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
