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

## 6. Firebase Security (Client-Side Checks)

Current implementation uses client-side validation. For production, you should add Firebase Security Rules:

### Recommended Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidUsername(username) {
      return username.size() >= 3
        && username.size() <= 20
        && username.matches('^[a-zA-Z0-9_-]*$');
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn()
        && isOwner(userId)
        && isValidUsername(request.resource.data.username);
      allow update: if isSignedIn()
        && isOwner(userId)
        && (!request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['userId', 'friendCode', 'createdAt']))
        && (request.resource.data.username == resource.data.username
            || isValidUsername(request.resource.data.username));
    }

    // Scores collection
    match /scores/{scoreId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn()
        && scoreId.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}_' + request.auth.uid + '_.*$')
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.timeSeconds >= 30
        && request.resource.data.timeSeconds <= 7200
        && request.resource.data.hintsUsed >= 0
        && request.resource.data.hintsUsed <= 5;
      allow update: if false; // Scores are immutable
      allow delete: if false; // Scores cannot be deleted
    }

    // Friend requests collection
    match /friendRequests/{requestId} {
      allow read: if isSignedIn()
        && (request.auth.uid == resource.data.fromUserId
            || request.auth.uid == resource.data.toUserId);
      allow create: if isSignedIn()
        && request.auth.uid == request.resource.data.fromUserId;
      allow update: if isSignedIn()
        && request.auth.uid == resource.data.toUserId;
      allow delete: if isSignedIn()
        && (request.auth.uid == resource.data.fromUserId
            || request.auth.uid == resource.data.toUserId);
    }
  }
}
```

**To apply**: Go to Firebase Console > Firestore Database > Rules tab

## 7. Future Enhancements

### Recommended for Production

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

---

**Questions or Concerns?**

If you discover a security vulnerability, please document it and consider:
- Not exploiting it for unfair advantage
- Reporting it so it can be fixed
- Helping make the game better for everyone
