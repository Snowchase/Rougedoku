# Quick Start: iOS TestFlight Deployment

## What You Need Right Now

1. **Apple Developer Account** - Sign up at https://developer.apple.com/programs/ ($99/year)
2. **Expo Account** - Create at https://expo.dev/signup (Free)

## 5-Minute Setup (Once Apple account is approved)

### Step 1: Update Your Bundle Identifier

Edit `app.json` line 18:
```json
"bundleIdentifier": "com.YOURNAME.sudokle"
```
Replace `YOURNAME` with your actual name or company name.

### Step 2: Register Bundle ID with Apple

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **+** → **App IDs** → **App** → Continue
3. Description: **Sudokle**
4. Bundle ID: **com.YOURNAME.sudokle** (must match app.json!)
5. Click **Register**

### Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. **My Apps** → **+** → **New App**
3. Fill out:
   - Name: **Sudokle**
   - Bundle ID: Select the one you just created
   - SKU: **sudokle-001**
4. Click **Create**

### Step 4: Build & Deploy

Run these commands in order:

```bash
# 1. Login to Expo
eas login

# 2. Configure EAS (one-time)
eas build:configure

# 3. Build for iOS
eas build --platform ios --profile preview

# 4. Follow prompts to authenticate with Apple
# (EAS will handle certificates automatically)

# 5. Wait for build to complete (10-30 minutes)

# 6. Submit to TestFlight
eas submit --platform ios --latest
```

### Step 5: Add Testers

1. Go to App Store Connect → TestFlight
2. Wait for build to process (~5-30 minutes)
3. Click **Internal Testing** → **Add Testers**
4. Enter email addresses
5. Testers receive invitation → download TestFlight app → install Sudokle

## That's It!

Your app is now on TestFlight! Testers can install it immediately.

## Next Build

When you make changes:

```bash
# Update version in app.json (line 5 and line 19)
"version": "1.0.1",
"buildNumber": "2",

# Build and submit
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

## Need More Details?

See the complete guide: `IOS_TESTFLIGHT_SETUP.md`

## Stuck?

**Common issue:** "Authentication failed"
→ Make sure you're using your Apple ID that's enrolled in the Developer Program

**Common issue:** "Bundle ID not available"
→ Someone else is using it. Pick a different one (e.g., add your name)

**Common issue:** "Build failed"
→ Run `eas build:list` to see error logs

## Support

- Expo Discord: https://chat.expo.dev/
- Full guide in repo: `IOS_TESTFLIGHT_SETUP.md`
