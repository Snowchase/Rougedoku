# Refer-a-Friend System — Implementation Plan

## Overview

Add a referral system where users share their unique referral code (same as existing friend code). When a new user enters a referral code, both the referrer and the referee receive coins.

---

## Coin Rewards

| Event | Coins |
|-------|-------|
| Referee enters a referral code | **+100 coins** |
| Referrer for each successful referral | **+50 coins** |

---

## Anti-abuse Rules

1. Each user can only be referred **once** (tracked via `hasBeenReferred` on user profile).
2. Users cannot refer themselves.
3. Referral must happen **before** the referee has completed their first puzzle (new-user-only perk). This prevents farming via alt accounts that have been active.
4. Referrer is capped at **50 referrals** maximum to prevent industrial farming.
5. Rate limit: max **5 referral code submissions per hour** per device (using existing `rateLimiter` from `utils/validation.ts`).

---

## Data Model Changes

### Firestore `users` collection — add fields to `UserProfile`

```ts
hasBeenReferred: boolean;      // default false — prevents double referral
referralCount: number;         // how many people this user has referred
referralCoinsEarned: number;   // lifetime coins earned from referrals
```

### New Firestore `referrals` collection

```ts
{
  referralCode: string;          // the referrer's friendCode
  referrerId: string;            // referrer's Firebase UID
  refereeId: string;             // new user's Firebase UID
  referrerCoinsAwarded: number;  // coins given to referrer
  refereeCoinsAwarded: number;   // coins given to referee
  createdAt: Timestamp;
}
```

---

## Files to Create / Modify

### 1. NEW — `services/referralService.ts`

Core referral logic, fully isolated:

- `submitReferralCode(referralCode: string): Promise<ReferralResult>` — main entry point
  - Validate non-empty code, uppercase normalize
  - Rate limit check (5/hr)
  - Load current user; check `hasBeenReferred` → reject if already referred
  - Lookup `users` where `friendCode == referralCode` → find referrer
  - Reject if referrer UID === current user UID (self-referral)
  - Reject if referrer `referralCount >= 50`
  - Check referee puzzle completion count from `userStats` — reject if > 0 solved puzzles
  - Write `referrals` document
  - Update referee profile: `hasBeenReferred = true`
  - Update referrer profile: `referralCount += 1`, `referralCoinsEarned += 50`
  - Award coins to referee via `addCoins` (100 coins)
  - Award coins to referrer via `addCoins` (50 coins) — must load referrer's local coin store (or store in Firestore and sync on next launch)
  - Return success + coins awarded
- `getReferralStats(userId: string): Promise<ReferralStats>` — for profile display
- `hasUserBeenReferred(userId: string): Promise<boolean>` — cheap check before showing UI

**Note on referrer coin award:** Since coins are stored in `AsyncStorage` (local), the referrer's coins update happens in Firestore (`referralCoinsEarned`). On the referrer's next app launch, `CurrencyContext` initialization checks for pending referral coin grants from Firestore and applies them locally. This is the same pattern as existing streak bonuses.

### 2. MODIFY — `components/friendService.ts`

- Add `hasBeenReferred`, `referralCount`, `referralCoinsEarned` to `UserProfile` interface
- Set defaults (`false`, `0`, `0`) when creating new profiles in `initializeUser()`

### 3. MODIFY — `contexts/CurrencyContext.tsx`

- Add `claimPendingReferralCoins()` function called during context initialization
  - Reads `referralCoinsEarned` from Firestore for current user
  - Compares with locally-tracked `referralCoinsGranted` (new AsyncStorage key: `sudokle_referral_coins_granted`)
  - Adds the difference via `addCoins()` and updates the local tracker
- Expose `submitReferral(code: string)` and `referralStats` via context

### 4. MODIFY — `utils/validation.ts`

- Add `REFERRAL_SUBMISSION` rate limit key (5 per hour) to `RATE_LIMITS`
- Add `validateReferralCode(code: string)` — checks length (6 chars), alphanumeric

### 5. MODIFY — `app/(tabs)/social.tsx`

Add a **"Refer a Friend"** section to the **Profile** tab (below the friend code share section):

**If user has NOT been referred yet:**
- Text input for entering a referral code
- "Apply Code" button
- Success/error feedback with coins awarded animation

**Always visible — "Your Referral Code" section:**
- Shows user's own friend code (already displayed as friend code — label it dual-purpose)
- "Share" button using native Share API: _"Join me on Sudokle! Use my code {CODE} to get 100 free coins!"_
- Shows referral stats: `{n} friends referred · {m} coins earned`

**States:**
- Loading spinner while submitting
- Already-referred state (grayed out, "You've already used a referral code")
- Error states: invalid code, self-referral, code not found, new-users-only

---

## Implementation Steps (ordered)

1. **`utils/validation.ts`** — add rate limit key + `validateReferralCode()`
2. **`components/friendService.ts`** — extend `UserProfile` interface + defaults
3. **`services/referralService.ts`** — create full service (NEW file)
4. **`contexts/CurrencyContext.tsx`** — add `claimPendingReferralCoins()` on init + expose referral functions
5. **`app/(tabs)/social.tsx`** — add Referral UI section to Profile tab

---

## UX Flow

```
New User (B) opens app
  → Goes to Profile tab
  → Sees "Enter referral code" field
  → Types friend A's code (= A's friend code)
  → Taps "Apply"
  → B gets +100 coins immediately (local addCoins)
  → A gets +50 coins next time A opens the app (Firestore → local sync on launch)
  → B's field becomes read-only: "Code applied! You earned 100 coins 🎉"

User A shares their code
  → Taps "Share My Code" button
  → Native share sheet: "Use code ABC123 on Sudokle to get 100 free coins!"
```

---

## Referral Code Reuse

The user's **friend code** doubles as the referral code — no new code needs to be generated or stored. This keeps the system simple and gives the existing friend code more utility.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Referee enters code multiple times | `hasBeenReferred` check blocks after first use |
| Referrer deletes account | Referral write will fail gracefully; referee still gets coins if referrer found initially |
| Invalid / nonexistent code | Clear error: "No user found with that code" |
| Network error during submit | Error shown; no partial state written (write referral doc last, after all checks) |
| Referrer at 50 cap | Error: "This referral code has reached its limit" |
| Referee has already played | Error: "Referral codes are for new players only" |
