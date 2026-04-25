// Validation and security utilities

// Basic profanity filter - expand this list as needed
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell',
  'crap', 'piss', 'dick', 'cock', 'pussy', 'whore',
  'slut', 'bastard', 'nigger', 'nigga', 'fag', 'faggot',
  'retard', 'cunt', 'twat', // Add more as needed
];

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Score validation constants
const MIN_SOLVE_TIME = 30; // 30 seconds minimum (impossibly fast)
const MAX_SOLVE_TIME = 7200; // 2 hours maximum
const MAX_HINTS = 5; // Maximum hints per game

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check for exact matches and variations with special characters
  return PROFANITY_LIST.some(word => {
    const pattern = new RegExp(word.split('').join('[^a-z]*'), 'i');
    return pattern.test(lowerText);
  });
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  // Check length
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters long`,
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be no more than ${USERNAME_MAX_LENGTH} characters long`,
    };
  }

  // Check for valid characters
  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    };
  }

  // Check for profanity
  if (containsProfanity(username)) {
    return {
      isValid: false,
      error: 'Username contains inappropriate language',
    };
  }

  // Check for reserved usernames
  const reservedNames = ['admin', 'moderator', 'sudokle', 'rougedoku', 'system', 'official'];
  if (reservedNames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved',
    };
  }

  return { isValid: true };
}

/**
 * Sanitize username by removing special characters
 */
export function sanitizeUsername(username: string): string {
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validate score submission
 */
export function validateScore(
  timeSeconds: number,
  hintsUsed: number,
  difficulty: string
): ValidationResult {
  // Check time bounds
  if (timeSeconds < MIN_SOLVE_TIME) {
    return {
      isValid: false,
      error: 'Solve time is suspiciously fast. Please play normally.',
    };
  }

  if (timeSeconds > MAX_SOLVE_TIME) {
    return {
      isValid: false,
      error: 'Solve time exceeded maximum allowed time',
    };
  }

  // Check hints
  if (hintsUsed < 0 || hintsUsed > MAX_HINTS) {
    return {
      isValid: false,
      error: 'Invalid number of hints used',
    };
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  if (!validDifficulties.includes(difficulty)) {
    return {
      isValid: false,
      error: 'Invalid difficulty level',
    };
  }

  // Additional heuristic: very fast times should have no hints
  if (timeSeconds < 60 && hintsUsed > 0) {
    return {
      isValid: false,
      error: 'Score appears suspicious',
    };
  }

  return { isValid: true };
}

/**
 * Check if date is valid (not in future, not too far in past)
 */
export function validateDate(dateString: string): ValidationResult {
  const date = new Date(dateString);
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  if (date > now) {
    return {
      isValid: false,
      error: 'Cannot submit scores for future dates',
    };
  }

  if (date < oneYearAgo) {
    return {
      isValid: false,
      error: 'Cannot submit scores for dates older than one year',
    };
  }

  return { isValid: true };
}

/**
 * Rate limiting helper - stores timestamps of actions
 */
export class RateLimiter {
  private actions: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed
   * @param key Unique identifier for the action (e.g., userId + actionType)
   * @param maxActions Maximum number of actions allowed
   * @param windowMs Time window in milliseconds
   */
  isAllowed(key: string, maxActions: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.actions.get(key) || [];

    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(t => now - t < windowMs);

    // Check if we've exceeded the limit
    if (recentTimestamps.length >= maxActions) {
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.actions.set(key, recentTimestamps);

    return true;
  }

  /**
   * Get remaining time until action is allowed again
   */
  getRetryAfter(key: string, maxActions: number, windowMs: number): number {
    const timestamps = this.actions.get(key) || [];
    if (timestamps.length < maxActions) return 0;

    const oldestRelevant = timestamps[timestamps.length - maxActions];
    const retryTime = oldestRelevant + windowMs;
    return Math.max(0, retryTime - Date.now());
  }

  /**
   * Clear all rate limit data for a key
   */
  clear(key: string): void {
    this.actions.delete(key);
  }
}

// Export singleton rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit constants
 */
export const RATE_LIMITS = {
  FRIEND_REQUEST: {
    maxActions: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
  },
  SCORE_SUBMISSION: {
    maxActions: 20,
    windowMs: 60 * 60 * 1000, // 20 submissions per hour
  },
  USERNAME_CHANGE: {
    maxActions: 3,
    windowMs: 24 * 60 * 60 * 1000, // 3 changes per day
  },
  REFERRAL_SUBMISSION: {
    maxActions: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour
  },
};

const REFERRAL_CODE_LENGTH = 6;
const REFERRAL_CODE_REGEX = /^[A-Z0-9]+$/;

/**
 * Validate referral code format
 */
export function validateReferralCode(code: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Please enter a referral code' };
  }

  const normalized = code.trim().toUpperCase();

  if (normalized.length !== REFERRAL_CODE_LENGTH) {
    return { isValid: false, error: `Referral code must be ${REFERRAL_CODE_LENGTH} characters` };
  }

  if (!REFERRAL_CODE_REGEX.test(normalized)) {
    return { isValid: false, error: 'Referral code can only contain letters and numbers' };
  }

  return { isValid: true };
}
