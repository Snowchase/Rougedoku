/**
 * Ad Service - Handles rewarded ads with Apple ATT compliance
 *
 * This service manages:
 * - App Tracking Transparency (ATT) requests
 * - Google AdMob initialization
 * - Rewarded ad loading and display
 * - Ad event handling
 */

import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import MobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
  RewardedAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
//Rewarded Ad units
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: 'ca-app-pub-4722969639622172/2984440613', // Real Ios ad unit ID for rewarded Ad in Shop Info tab
      android: 'ca-app-pub-4722969639622172/2984440613', // Real Android reward unit ID for rewarded Ad in Shop Info tab
    }) || TestIds.REWARDED;

// Rewarded Interstitial Ad unit for coin boost feature
const REWARDED_INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-4722969639622172/8234036903', // Real Ios ad unit ID for rewarded interstitial Ad in coin boost feature
      android: 'ca-app-pub-4722969639622172/6948440627', // Real Android ad unit ID for rewarded interstitial Ad in coin boost feature
    }) || TestIds.REWARDED_INTERSTITIAL;

const COINS_PER_AD = 25; // Reward amount per ad

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private rewardedInterstitialAd: RewardedInterstitialAd | null = null;
  private isInitialized = false;
  private loadRewardedAdPromise: Promise<void> | null = null;
  private loadInterstitialAdPromise: Promise<void> | null = null;
  private hasRequestedATT = false;

  /**
   * Initialize the Mobile Ads SDK with ATT compliance
   * This should be called on app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('AdService already initialized');
      return;
    }

    try {
      // Request App Tracking Transparency on iOS
      if (Platform.OS === 'ios') {
        await this.requestTrackingPermission();
      }

      // Initialize Google Mobile Ads
      await MobileAds().initialize();

      console.log('AdService initialized successfully');
      this.isInitialized = true;

      // Pre-load the first ads
      await Promise.all([
        this.loadRewardedAd(),
        this.loadRewardedInterstitialAd(),
      ]);
    } catch (error) {
      console.error('Failed to initialize AdService:', error);
      throw error;
    }
  }

  /**
   * Request App Tracking Transparency permission (iOS only)
   * This is required by Apple's privacy policy before showing personalized ads
   */
  private async requestTrackingPermission(): Promise<AdsConsentStatus> {
    if (Platform.OS !== 'ios' || this.hasRequestedATT) {
      return AdsConsentStatus.NOT_REQUIRED;
    }

    try {
      // Step 1: Show the native iOS ATT dialog (required by Apple before any tracking data is collected)
      const { status: attStatus } = await requestTrackingPermissionsAsync();
      console.log('Native iOS ATT status:', attStatus);

      this.hasRequestedATT = true;

      // Step 2: Proceed with Google's UMP consent flow (for GDPR/EU users)
      const consentInfo = await AdsConsent.requestInfoUpdate();

      console.log('UMP Consent Status:', consentInfo.status);

      // If consent is required, show the consent form
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        const consentFormResult = await AdsConsent.showForm();
        console.log('Consent form result:', consentFormResult);
        return consentFormResult.status;
      }

      return consentInfo.status;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return AdsConsentStatus.UNKNOWN;
    }
  }

  /**
   * Load a rewarded ad.
   * Returns a promise that resolves when the ad is ready, or rejects on error.
   * Concurrent calls share the same in-flight promise so only one load runs at a time.
   */
  private loadRewardedAd(): Promise<void> {
    if (this.rewardedAd?.loaded) {
      return Promise.resolve();
    }

    if (this.loadRewardedAdPromise) {
      return this.loadRewardedAdPromise;
    }

    this.loadRewardedAdPromise = new Promise<void>((resolve, reject) => {
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });
      this.rewardedAd = ad;

      const loadedListener = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        loadedListener();
        errorListener();
        this.loadRewardedAdPromise = null;
        console.log('Rewarded ad loaded successfully');
        resolve();
      });

      const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        loadedListener();
        errorListener();
        this.rewardedAd = null;
        this.loadRewardedAdPromise = null;
        console.error('Failed to load rewarded ad:', error);
        reject(error);
      });

      ad.load();
    });

    return this.loadRewardedAdPromise;
  }

  /**
   * Check if a rewarded ad is ready to show
   */
  isRewardedAdReady(): boolean {
    return this.rewardedAd?.loaded ?? false;
  }

  /**
   * Show a rewarded ad
   * Returns a promise that resolves with the reward amount if the user earned it,
   * or rejects if the ad failed or was dismissed
   */
  async showRewardedAd(): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('AdService not initialized. Call initialize() first.');
    }

    if (!this.rewardedAd?.loaded) {
      await this.loadRewardedAd();
    }

    return new Promise((resolve, reject) => {
      let hasEarnedReward = false;

      // Set up event listeners
      const earnedRewardListener = this.rewardedAd!.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          console.log('User earned reward:', reward);
          hasEarnedReward = true;
        }
      );

      const dismissedListener = this.rewardedAd!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('Rewarded ad dismissed');

          // Clean up listeners
          earnedRewardListener();
          dismissedListener();

          // Load next ad
          this.loadRewardedAd();

          // Resolve or reject based on whether reward was earned
          if (hasEarnedReward) {
            resolve(COINS_PER_AD);
          } else {
            reject(new Error('Ad dismissed without earning reward'));
          }
        }
      );

      // Show the ad
      this.rewardedAd!.show().catch(error => {
        console.error('Failed to show rewarded ad:', error);

        // Clean up listeners
        earnedRewardListener();
        dismissedListener();

        // Load next ad
        this.loadRewardedAd();

        reject(error);
      });
    });
  }

  /**
   * Get the reward amount for watching an ad
   */
  getRewardAmount(): number {
    return COINS_PER_AD;
  }

  /**
   * Load a rewarded interstitial ad (for coin boost feature).
   * Returns a promise that resolves when the ad is ready, or rejects on error.
   * Concurrent calls share the same in-flight promise so only one load runs at a time.
   */
  private loadRewardedInterstitialAd(): Promise<void> {
    if (this.rewardedInterstitialAd?.loaded) {
      return Promise.resolve();
    }

    if (this.loadInterstitialAdPromise) {
      return this.loadInterstitialAdPromise;
    }

    this.loadInterstitialAdPromise = new Promise<void>((resolve, reject) => {
      const ad = RewardedInterstitialAd.createForAdRequest(
        REWARDED_INTERSTITIAL_AD_UNIT_ID,
        { requestNonPersonalizedAdsOnly: false }
      );
      this.rewardedInterstitialAd = ad;

      const loadedListener = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        loadedListener();
        errorListener();
        this.loadInterstitialAdPromise = null;
        console.log('Rewarded interstitial ad loaded successfully');
        resolve();
      });

      const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        loadedListener();
        errorListener();
        this.rewardedInterstitialAd = null;
        this.loadInterstitialAdPromise = null;
        console.error('Failed to load rewarded interstitial ad:', error);
        reject(error);
      });

      ad.load();
    });

    return this.loadInterstitialAdPromise;
  }

  /**
   * Check if a rewarded interstitial ad is ready to show
   */
  isRewardedInterstitialAdReady(): boolean {
    return this.rewardedInterstitialAd?.loaded ?? false;
  }

  /**
   * Show a rewarded interstitial ad (for coin boost feature)
   * Returns a promise that resolves with true if the user earned the reward,
   * or rejects if the ad failed or was dismissed without earning
   */
  async showRewardedInterstitialAd(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('AdService not initialized. Call initialize() first.');
    }

    if (!this.rewardedInterstitialAd?.loaded) {
      await this.loadRewardedInterstitialAd();
    }

    return new Promise((resolve, reject) => {
      let hasEarnedReward = false;

      // Set up event listeners
      const earnedRewardListener = this.rewardedInterstitialAd!.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          console.log('User earned reward from interstitial:', reward);
          hasEarnedReward = true;
        }
      );

      const dismissedListener = this.rewardedInterstitialAd!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('Rewarded interstitial ad dismissed');

          // Clean up listeners
          earnedRewardListener();
          dismissedListener();

          // Load next ad
          this.loadRewardedInterstitialAd();

          // Resolve or reject based on whether reward was earned
          if (hasEarnedReward) {
            resolve(true);
          } else {
            reject(new Error('Ad dismissed without earning reward'));
          }
        }
      );

      // Show the ad
      this.rewardedInterstitialAd!.show().catch(error => {
        console.error('Failed to show rewarded interstitial ad:', error);

        // Clean up listeners
        earnedRewardListener();
        dismissedListener();

        // Load next ad
        this.loadRewardedInterstitialAd();

        reject(error);
      });
    });
  }

  /**
   * Check if ATT permission has been requested
   */
  hasRequestedTrackingPermission(): boolean {
    return this.hasRequestedATT;
  }

  /**
   * Get current consent status
   */
  async getConsentStatus(): Promise<AdsConsentStatus> {
    if (Platform.OS !== 'ios') {
      return AdsConsentStatus.NOT_REQUIRED;
    }

    try {
      const consentInfo = await AdsConsent.getConsentInfo();
      return consentInfo.status;
    } catch (error) {
      console.error('Error getting consent status:', error);
      return AdsConsentStatus.UNKNOWN;
    }
  }
}

// Export singleton instance
export const adService = new AdService();
export { COINS_PER_AD };

