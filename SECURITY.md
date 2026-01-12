# Security Features

This document outlines the security measures implemented in Sudokle to prevent abuse and ensure fair play.

## 1. Username/Display Name Protection

### Validation Rules
- **Length**: 3-20 characters
- **Characters**: Only alphanumeric, hyphens, and underscores allowed
- **Pattern**: `^[a-zA-Z0-9_-]{3,20}$`

### Profanity Filter
A comprehensive profanity filter blocks offensive usernames. The filter includes:
- Common profanity and slurs
- Variations with numbers (e.g., "h3ll0")
- Case-insensitive matching

### Reserved Names
System names are blocked: `admin`, `moderator`, `system`, `sudokle`

### Rate Limiting
- **Username Changes**: 3 per day (24 hours)
- Prevents spam and abuse of the username system

**Location**: `utils/validation.ts:validateUsername()`

## 2. Score Validation & Anti-Cheat

### Time Validation
- **Minimum Time**: 30 seconds (prevents impossible completion times)
- **Maximum Time**: 7200 seconds (2 hours)
- Difficulty-specific minimums:
  - Easy: 30 seconds
  - Medium: 45 seconds
  - Hard: 60 seconds

### Hints Validation
- **Range**: 0-5 hints allowed
- **Heuristic**: Very fast times (<60s) shouldn't use hints
  - If time < 60s and hints > 0, flagged as suspicious

### Date Validation
- **Format**: YYYY-MM-DD
- **Range**: Not in the future, not more than 1 year in the past
- Prevents submitting scores for invalid dates

### Rate Limiting
- **Score Submissions**: 20 per hour
- Prevents spam and automated submissions

**Location**: `utils/validation.ts:validateScore()`

## 3. Friend System Protection

### Friend Request Rate Limiting
- **Limit**: 10 requests per hour
- **Cooldown**: Shows minutes until next request allowed
- Prevents friend request spam

### Block Functionality
Users can block other users to prevent harassment:
- **Effect**:
  - Blocked user cannot send friend requests
  - Existing friendship is removed
  - All pending friend requests are deleted
  - Blocked user cannot see blocker in searches
- **Functions**: `blockUser()`, `unblockUser()`, `getBlockedUsers()`

### Privacy Protections
- Cannot add yourself as a friend
- Blocked users receive generic "Unable to send friend request" message (no disclosure of block status)
- Already-friends check prevents duplicate relationships

**Location**: `components/friendService.ts`

## 4. Rate Limiting System

### Implementation
Uses a simple in-memory cache with timestamps:
```typescript
class RateLimiter {
  isAllowed(key: string, maxActions: number, windowMs: number): boolean
  getRetryAfter(key: string, maxActions: number, windowMs: number): number
}
```

### Rate Limits Summary
| Action | Limit | Window |
|--------|-------|--------|
| Friend Requests | 10 | 1 hour |
| Score Submissions | 20 | 1 hour |
| Username Changes | 3 | 24 hours |

**Location**: `utils/validation.ts:RateLimiter`

## 5. Input Sanitization

All user inputs are validated and sanitized:
- **Usernames**: Pattern matching, profanity filter
- **Scores**: Type checking, range validation
- **Dates**: Format validation, range checking
- **Friend Codes**: Uppercase conversion, format validation

**To apply**: Go to Firebase Console > Firestore Database > Rules tab

## Future Enhancements for Production

1. **Server-Side Score Verification**
   - Move score validation to Cloud Functions
   - Verify puzzle solution is correct
   - Check solve time against complexity metrics

2. **Anomaly Detection**
   - Flag users with suspicious patterns (e.g., always solving in exactly 60 seconds)
   - Monitor for sudden skill improvements
   - Track submission patterns

3. **Content Moderation**
   - Expand profanity list with community reports
   - Add machine learning-based content filtering
   - Implement user reporting system

4. **Enhanced Rate Limiting**
   - Use Redis or similar for distributed rate limiting
   - Implement progressive penalties (temporary bans)
   - IP-based rate limiting in addition to user-based

5. **Audit Logging**
   - Log all security events (blocked usernames, rate limit hits)
   - Track user behavior patterns
   - Monitor for coordinated abuse

## 8. Testing Security Features

### Manual Testing Checklist

- [ ] Try creating username with profanity → should be blocked
- [ ] Try username with special characters → should be blocked
- [ ] Try submitting score <30 seconds → should be rejected
- [ ] Try submitting 11 friend requests in 1 hour → 11th should be blocked
- [ ] Try changing username 4 times in one day → 4th should be blocked
- [ ] Try blocking a user → friend requests should be prevented
- [ ] Try submitting score for future date → should be rejected
- [ ] Try submitting score with 6 hints → should be rejected

### Automated Testing (TODO)
Consider adding unit tests for validation functions in `utils/validation.ts`.

## 9. Incident Response

If you detect abuse:
1. Check Firebase Console for suspicious activity
2. Review user's submission history in Firestore
3. Use Firebase Authentication to disable abusive accounts
4. Update profanity filter if new patterns emerge
5. Adjust rate limits if current limits are insufficient

## 10. Privacy Considerations

- User IDs are Firebase anonymous auth UIDs (not personally identifiable)
- No email, phone, or real names are collected
- Blocked users don't know they're blocked (privacy-preserving)
- Leaderboards only show public profile info (username, avatar)

### Ad Privacy & Tracking Transparency

Sudokle implements rewarded ads with full compliance to Apple's App Tracking Transparency (ATT) requirements:

- **User Consent**: Users are prompted before any ad tracking begins
- **ATT Prompt**: iOS users receive Apple's standard tracking permission dialog
- **Opt-Out Support**: Users can decline tracking and still use all app features
- **Limited Data**: Only advertising identifier is shared with ad networks
- **Transparency**: Privacy policy clearly explains ad network data practices

**Ad Networks Used**: Google AdMob

**Data Collected by Ads**:
- Device advertising identifier (IDFA on iOS)
- Device type and OS version
- Ad interaction data (impressions, clicks)
- General location (country/region, not precise location)

**User Rights**:
- Users can opt out of personalized ads via ATT prompt
- Users can change tracking preferences in iOS Settings
- All rewarded ads are optional - users choose when to watch

**Implementation**: `services/adService.ts`

---

**Questions or Concerns?**

If you discover a security vulnerability, please document it and consider:
- Not exploiting it for unfair advantage
- Reporting it so it can be fixed
- Helping make the game better for everyone
