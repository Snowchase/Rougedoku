// referralService.ts
// Handles the refer-a-friend system: validating codes, awarding coins to both parties.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';
import { getUserStats } from './statsService';
import { rateLimiter, RATE_LIMITS, validateReferralCode } from '../utils/validation';

// Coins awarded to each party
export const REFERRAL_COINS_REFEREE = 100;  // coins for the new user who enters a code
export const REFERRAL_COINS_REFERRER = 50;  // coins for the user whose code was used

// Maximum referrals a single user can receive credit for
const MAX_REFERRALS_PER_USER = 50;

export interface ReferralResult {
  success: boolean;
  error?: string;
  coinsEarned?: number;
}

export interface ReferralStats {
  referralCount: number;
  referralCoinsEarned: number;
  hasBeenReferred: boolean;
}

/**
 * Submit a referral code entered by the current user (referee).
 * Awards coins to both the referee (immediately) and the referrer (on their next launch via sync).
 */
export async function submitReferralCode(referralCode: string): Promise<ReferralResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'You must be logged in to use a referral code' };
  }

  // Validate code format
  const normalized = referralCode.trim().toUpperCase();
  const formatCheck = validateReferralCode(normalized);
  if (!formatCheck.isValid) {
    return { success: false, error: formatCheck.error };
  }

  // Rate limit per user
  const rateLimitKey = `referral_submit_${user.uid}`;
  if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.REFERRAL_SUBMISSION.maxActions, RATE_LIMITS.REFERRAL_SUBMISSION.windowMs)) {
    return { success: false, error: 'Too many attempts. Please wait a while before trying again.' };
  }

  // Load referee's own profile
  const refereeDoc = await getDoc(doc(db, 'users', user.uid));
  if (!refereeDoc.exists()) {
    return { success: false, error: 'Could not load your profile. Please try again.' };
  }
  const refereeData = refereeDoc.data();

  // Check if already referred
  if (refereeData.hasBeenReferred === true) {
    return { success: false, error: 'You have already used a referral code.' };
  }

  // Self-referral check: reject if the normalized code matches the referee's own friend code
  if (refereeData.friendCode === normalized) {
    return { success: false, error: 'You cannot use your own referral code.' };
  }

  // New-player-only: reject if the referee has already solved any puzzles
  const refereeStats = await getUserStats(user.uid);
  if (refereeStats && refereeStats.totalPuzzlesSolved > 0) {
    return { success: false, error: 'Referral codes are for new players only.' };
  }

  // Find referrer by friend code
  const usersRef = collection(db, 'users');
  const referrerQuery = query(usersRef, where('friendCode', '==', normalized));
  const referrerSnap = await getDocs(referrerQuery);

  if (referrerSnap.empty) {
    return { success: false, error: 'No player found with that code. Please check and try again.' };
  }

  const referrerDoc = referrerSnap.docs[0];
  const referrerId = referrerDoc.id;
  const referrerData = referrerDoc.data();

  // Double-check self-referral by UID
  if (referrerId === user.uid) {
    return { success: false, error: 'You cannot use your own referral code.' };
  }

  // Check referrer cap
  const currentReferralCount = referrerData.referralCount ?? 0;
  if (currentReferralCount >= MAX_REFERRALS_PER_USER) {
    return { success: false, error: 'This referral code has reached its limit.' };
  }

  // All checks passed — write referral record
  const referralId = `${referrerId}_${user.uid}`;
  await setDoc(doc(db, 'referrals', referralId), {
    referralCode: normalized,
    referrerId,
    refereeId: user.uid,
    referrerCoinsAwarded: REFERRAL_COINS_REFERRER,
    refereeCoinsAwarded: REFERRAL_COINS_REFEREE,
    createdAt: serverTimestamp(),
  });

  // Mark referee as referred
  await updateDoc(doc(db, 'users', user.uid), {
    hasBeenReferred: true,
  });

  // Credit referrer in Firestore (picked up on their next launch via claimPendingReferralCoins)
  await updateDoc(doc(db, 'users', referrerId), {
    referralCount: currentReferralCount + 1,
    referralCoinsEarned: (referrerData.referralCoinsEarned ?? 0) + REFERRAL_COINS_REFERRER,
  });

  return { success: true, coinsEarned: REFERRAL_COINS_REFEREE };
}

/**
 * Get referral stats for a user (for display in the profile UI).
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { referralCount: 0, referralCoinsEarned: 0, hasBeenReferred: false };
    }
    const data = userDoc.data();
    return {
      referralCount: data.referralCount ?? 0,
      referralCoinsEarned: data.referralCoinsEarned ?? 0,
      hasBeenReferred: data.hasBeenReferred ?? false,
    };
  } catch {
    return { referralCount: 0, referralCoinsEarned: 0, hasBeenReferred: false };
  }
}
