# Ad Testing Guide for Sudokle

## Quick Start: Test Ads on Android Emulator

### Prerequisites
- ✅ Android Studio installed
- ✅ Android emulator created (Pixel 5, API 33 recommended)
- ✅ Emulator running

### Step 1: Build and Run
```bash
npx expo run:android
```

**Build time:** 5-10 minutes first time, 2-3 minutes after

### Step 2: Test Ads
1. Open app on emulator
2. Navigate: **Shop → Info tab**
3. Tap **"Watch Ad for Coins"**
4. Watch the test ad
5. Verify you receive **25 coins**

---

## Current Configuration

### Test IDs (Development)
- **Android App ID:** `ca-app-pub-3940256099942544~3347511713` (test)
- **iOS App ID:** `ca-app-pub-4722969639622172/2984440613` (production)
- **Rewarded Ad Unit:** Using `TestIds.REWARDED` in development

### Build Settings
- ✅ New Architecture: **Disabled** (required for current AdMob library)
- ✅ ATT Description: Added for iOS privacy compliance
- ✅ AdMob plugin: Configured in app.json

---

## For Production Release

### 1. Get Real AdMob IDs
1. Go to https://admob.google.com/
2. Create app for Android and iOS
3. Create "Rewarded" ad units for both platforms
4. Copy your 4 IDs:
   - Android App ID
   - Android Rewarded Ad Unit ID
   - iOS App ID
   - iOS Rewarded Ad Unit ID

### 2. Update app.json
Replace test IDs in `app.json` line 60-61:
```json
"androidAppId": "ca-app-pub-YOUR-ID~YYYYYYYYYY",
"iosAppId": "ca-app-pub-YOUR-ID~ZZZZZZZZZZ"
```

### 3. Update adService.ts
Replace placeholders in `services/adService.ts` lines 23-24:
```typescript
ios: 'ca-app-pub-YOUR-ID/REWARDED-UNIT',
android: 'ca-app-pub-YOUR-ID/REWARDED-UNIT'
```

---

## Troubleshooting

### Build fails with "newArchEnabled" error
- **Fix:** Set `"newArchEnabled": false` in app.json (line 10)
- **Reason:** Current AdMob library doesn't support new architecture yet

### "Module not found" error
- **Fix:** You need to build with native modules (can't use Expo Go)
- **Solution:** Use `npx expo run:android` or Android emulator

### Ads don't load
- ✅ Check internet connection on emulator
- ✅ Verify emulator has Google Play Services
- ✅ Check Metro bundler logs for errors

---

## Files Modified for Ad Support

1. ✅ `app.json` - AdMob configuration & ATT description
2. ✅ `services/adService.ts` - **NEW** Ad management with ATT
3. ✅ `contexts/CurrencyContext.tsx` - Ad reward integration
4. ✅ `app/_layout.tsx` - Initialize AdService on startup
5. ✅ `app/shop.tsx` - "Watch Ad for Coins" UI
6. ✅ `services/adService.mock.ts` - **NEW** Mock for Expo Go testing

---

## Privacy Compliance

### iOS (App Tracking Transparency)
- ✅ NSUserTrackingUsageDescription added to app.json
- ✅ ATT prompt shown before ad tracking
- ✅ Users can opt out and still use all features

### User Control
- ✅ All ads are optional (user-initiated)
- ✅ No forced or interstitial ads
- ✅ Clear consent flow

---

## Next Steps

1. **Test on emulator** - Verify ads work with test IDs ✅
2. **Set up AdMob account** - Get production IDs
3. **Update IDs** - Replace test IDs with production
4. **Test on device** - Verify ATT prompt and real ads
5. **Submit to stores** - Include ad disclosure in listing
