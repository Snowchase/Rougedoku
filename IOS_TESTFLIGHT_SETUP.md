# iOS TestFlight Setup Guide for Sudokle

This guide will walk you through deploying your Sudokle app to TestFlight for beta testing.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Wait for approval (usually 24-48 hours)

2. **Expo Account** (Free)
   - Create at: https://expo.dev/signup

## Step-by-Step Instructions

### 1. Configure Your Bundle Identifier

**IMPORTANT:** Before building, you need to update the bundle identifier in `app.json`:

```json
"ios": {
  "bundleIdentifier": "com.yourcompany.sudokle"
}
```

Replace `com.yourcompany.sudokle` with your own unique identifier. Common formats:
- `com.yourname.sudokle`
- `com.yourdomain.sudokle`

**Note:** This MUST be unique and match what you register in Apple Developer Portal.

### 2. Register Bundle ID in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** button to create a new identifier
3. Select **App IDs** and click **Continue**
4. Select **App** and click **Continue**
5. Enter:
   - **Description**: Sudokle
   - **Bundle ID**: `com.yourcompany.sudokle` (must match app.json)
6. Scroll down and select capabilities you need (none required for now)
7. Click **Continue** and then **Register**

### 3. Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps**
3. Click the **+** button and select **New App**
4. Fill out the form:
   - **Platforms**: iOS
   - **Name**: Sudokle
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: Select the one you just created
   - **SKU**: Can be anything unique (e.g., `sudokle-001`)
   - **User Access**: Full Access
5. Click **Create**

### 4. Login to Expo Account

```bash
eas login
```

Enter your Expo credentials when prompted.

### 5. Configure EAS Project

```bash
eas build:configure
```

This will:
- Link your project to an Expo account
- Update the `projectId` in app.json
- You may need to commit these changes

### 6. Update Apple Credentials in eas.json (Optional)

Open `eas.json` and update the submit section:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "YOUR_ASC_APP_ID",
      "appleTeamId": "YOUR_APPLE_TEAM_ID"
    }
  }
}
```

**How to find these:**
- **appleId**: Your Apple ID email
- **ascAppId**: Found in App Store Connect > App Information > Apple ID (number)
- **appleTeamId**: Found at https://developer.apple.com/account > Membership > Team ID

### 7. Build for TestFlight

Run the preview build command:

```bash
eas build --platform ios --profile preview
```

**What happens next:**
1. EAS will ask you to authenticate with Apple
2. You'll be prompted to:
   - Log in with your Apple ID
   - Provide your Apple Developer account credentials
   - Generate/select provisioning profiles
3. The build will run on Expo's servers (takes 10-30 minutes)
4. You'll get a download link when complete

**Note:** First build may take longer as EAS sets up certificates and provisioning profiles.

### 8. Submit to TestFlight

Once the build completes successfully, submit it to TestFlight:

```bash
eas submit --platform ios --latest
```

This will:
- Upload your build to App Store Connect
- Make it available in TestFlight within 5-10 minutes
- Send you an email when processing is complete

### 9. Configure TestFlight

1. Go to https://appstoreconnect.apple.com/
2. Click on your **Sudokle** app
3. Go to **TestFlight** tab
4. Wait for the build to finish processing (Apple's review, ~5-30 minutes)
5. Once processed, click on the build
6. Fill out required information:
   - **What to Test**: Brief description of what testers should focus on
   - **Test Information**: Any special instructions
   - **Export Compliance**: Select appropriate option (usually "No" for puzzle games)

### 10. Add Testers

**Internal Testing (up to 100 testers, instant access):**
1. Go to TestFlight > Internal Testing
2. Click **Add Internal Testers**
3. Add email addresses of team members
4. They'll receive an email invitation

**External Testing (up to 10,000 testers, requires Apple review):**
1. Go to TestFlight > External Testing
2. Create a new group
3. Add testers by email
4. Submit for Beta App Review (takes ~24 hours)

### 11. Testers Download the App

Testers need to:
1. Install **TestFlight** app from the App Store
2. Click the invitation link you sent
3. Accept the invite in TestFlight
4. Tap **Install** to download Sudokle

## Updating the App

When you make changes and want to release a new version:

1. **Update version numbers** in app.json:
   ```json
   "version": "1.0.1",
   "ios": {
     "buildNumber": "2"
   }
   ```

2. **Build again**:
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios --latest
   ```

4. **Notify testers** - TestFlight will automatically notify them of the new build

## Common Issues & Solutions

### Issue: "Bundle identifier is not available"
**Solution:** The bundle ID is already taken. Choose a different one in app.json and re-register in Apple Developer Portal.

### Issue: "Apple Developer account not found"
**Solution:** Make sure your Apple Developer Program enrollment is complete and active.

### Issue: "Provisioning profile doesn't include signing certificate"
**Solution:** Let EAS handle this automatically, or revoke and regenerate in `eas credentials`.

### Issue: Build fails with code signing error
**Solution:** Run:
```bash
eas credentials
```
Select iOS, then "Manage credentials", and choose "Remove provisioning profile" and "Remove distribution certificate". Then rebuild - EAS will create new ones.

### Issue: TestFlight processing takes forever
**Solution:** This is normal for first build. Subsequent builds process faster. If it's been >2 hours, contact Apple Developer Support.

## Production Release (App Store)

When you're ready to release to the App Store:

1. Build with production profile:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store:
   ```bash
   eas submit --platform ios --latest
   ```

3. Complete App Store listing in App Store Connect:
   - Screenshots (required for multiple device sizes)
   - App description
   - Keywords
   - Privacy policy URL
   - Category
   - Age rating

4. Submit for App Review
   - Review time: 1-3 days typically
   - Apple will test your app and approve/reject

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Manage credentials
eas credentials

# Check project configuration
eas build:configure

# Submit specific build
eas submit --platform ios --id <build-id>
```

## Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **EAS Submit Documentation**: https://docs.expo.dev/submit/introduction/
- **TestFlight Documentation**: https://developer.apple.com/testflight/
- **App Store Connect Help**: https://developer.apple.com/help/app-store-connect/

## Next Steps

Once you've successfully deployed to TestFlight:
1. Test the app thoroughly on real devices
2. Gather feedback from beta testers
3. Fix any bugs or issues
4. Update and redeploy as needed
5. When ready, submit to the App Store for public release

---

**Need Help?**
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/
- Apple Developer Forums: https://developer.apple.com/forums/

Good luck with your launch! 🚀
