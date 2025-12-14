import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go (where native modules aren't available)
const isExpoGo = Constants.appOwnership === 'expo';

// Use test IDs during development, replace with real IDs for production
// To get real Ad Unit IDs, create them in your AdMob console: https://admob.google.com
const TEST_REWARDED_AD_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
}) || '';

const PRODUCTION_REWARDED_AD_ID = Platform.select({
  ios: 'ca-app-pub-4722969639622172/XXXXXXXXXX', // Replace XXXXXXXXXX with your iOS rewarded ad unit ID
  android: 'ca-app-pub-4722969639622172/XXXXXXXXXX', // Replace XXXXXXXXXX with your Android rewarded ad unit ID
}) || '';

const REWARDED_AD_UNIT_ID = __DEV__ ? TEST_REWARDED_AD_ID : PRODUCTION_REWARDED_AD_ID;

interface IAdService {
  isAdsAvailable(): boolean;
  isExpoGo(): boolean;
  initialize(): Promise<void>;
  isRewardedAdReady(): boolean;
  showRewardedAd(): Promise<boolean>;
}

// Stub implementation - works in Expo Go without crashing
// To enable real ads, create a development build: npx expo run:android or npx expo run:ios
class AdServiceStub implements IAdService {
  isAdsAvailable(): boolean {
    return false;
  }

  isExpoGo(): boolean {
    return isExpoGo;
  }

  async initialize(): Promise<void> {
    if (isExpoGo) {
      console.log('Ads not available in Expo Go. Create a development build to enable ads.');
      console.log('Run: npx expo run:android or npx expo run:ios');
    }
  }

  isRewardedAdReady(): boolean {
    return false;
  }

  async showRewardedAd(): Promise<boolean> {
    console.log('Ads not available. Create a development build to enable ads.');
    return false;
  }
}

// Export the stub service
// When you create a development build, you can update this to use the real implementation
export const adService: IAdService = new AdServiceStub();

/*
 * ============================================
 * DEVELOPMENT BUILD IMPLEMENTATION
 * ============================================
 *
 * When you're ready to test ads with a development build:
 *
 * 1. Install the package: npx expo install react-native-google-mobile-ads
 * 2. Add to app.json plugins:
 *    ["react-native-google-mobile-ads", {
 *      "androidAppId": "ca-app-pub-4722969639622172~7306998501",
 *      "iosAppId": "ca-app-pub-4722969639622172~7306998501"
 *    }]
 * 3. Build with: npx expo run:android or npx expo run:ios
 * 4. Update this file to import and use the real implementation
 *
 * AdMob App ID: ca-app-pub-4722969639622172~7306998501
 */
