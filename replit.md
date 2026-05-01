# Workspace — FinWallet

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## FinWallet / Livra Payment Mobile App

Expo (React Native) wallet app at `artifacts/mobile/`. Uganda-focused, Relworx-powered payments, Firebase Firestore backend.

### Architecture
- **Backend URL**: `https://function-bun-production-37b5.up.railway.app` (Railway, auto-selected)
- **Auth**: Relworx phone validation + 4-digit PIN (AsyncStorage). No Firebase Auth. Firestore docs keyed by phone (`users/{phone}`).
- **Balance**: Real-time from Firestore `users/{phone}.balanceUGX` via `useAuth()` context.
- **Payments**: All deductions go through `deductBalance()` in authContext (Firestore + transaction log).
- **Colors**: Navy `#0A1628`, Gold `#C9A84C` throughout.

### Auth Flow
1. `app/auth/index.tsx` — phone entry (Uganda +256), Relworx `validatePhone`
2. `app/auth/pin.tsx` — 4-digit PIN (setup on first login, verify on return)
3. `AuthGate` in `app/_layout.tsx` — redirects based on `customerName / hasPinSet / pinVerified`

### Firestore Model
- `users/{phone}` — `{ name, balanceUGX, pushToken }`
- `users/{phone}/transactions` — all debit/credit records
- `users/{phone}/savings` — savings pots
- `users/{phone}/loans` — loan applications
- `users/{phone}/notifications` — push notification records

### Key Files
- `lib/firebase.ts` — Firestore export
- `lib/firestore.ts` — All Firestore CRUD (balance, transactions, savings, loans, notifications)
- `lib/authContext.tsx` — `AuthProvider` with `balanceUGX`, `deductBalance`, `creditBalance`, `refreshBalance`
- `lib/notificationService.ts` — Expo push notification registration
- `lib/relworx.ts` — All Relworx API calls (products, validate, purchase, poll status, withdraw)
- `lib/api.ts` — `apiFetch` wrapper pointing to Railway backend
- `lib/userSession.ts` — phone → customer_reference prefix
- `app/bank.tsx` — Bank transfer; real Firestore deduction, real bank list from Relworx
- `app/buy.tsx` — Airtime/data purchase; wallet balance deduction
- `app/pay.tsx` — Utility payments; wallet balance deduction
- `app/settings.tsx` — Profile & settings screen
- `app/notifications.tsx` — Firestore notifications with mark-read
- `app/(tabs)/index.tsx` — Home; real Firestore balance & transactions, avatar→settings, bell→notifications
- `app/(tabs)/analytics.tsx` — Real Firestore transactions, monthly chart
- `app/(tabs)/savings.tsx` — Real Firestore savings pots
- `app/(tabs)/wallet.tsx` — Loans screen; Firestore loans, no phone re-verification
- `app/(tabs)/send.tsx` — Send money; wallet balance check & Firestore deduction

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
