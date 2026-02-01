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
import MobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';
//Rewarded Ad units
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: 'ca-app-pub-4722969639622172/2984440613',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // Replace with real Android ad unit ID
    }) || TestIds.REWARDED;

const COINS_PER_AD = 25; // Reward amount per ad

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private isInitialized = false;
  private isLoading = false;
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

      // Pre-load the first ad
      await this.loadRewardedAd();
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
      const consentInfo = await AdsConsent.requestInfoUpdate();
      this.hasRequestedATT = true;

      console.log('ATT Consent Status:', consentInfo.status);

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
   * Load a rewarded ad
   */
  private async loadRewardedAd(): Promise<void> {
    if (this.isLoading || (this.rewardedAd && this.rewardedAd.loaded)) {
      return;
    }

    try {
      this.isLoading = true;

      // Create a new rewarded ad instance
      this.rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Load the ad
      this.rewardedAd.load();

      console.log('Rewarded ad loaded successfully');
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.rewardedAd = null;
    } finally {
      this.isLoading = false;
    }
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

    if (!this.rewardedAd || !this.rewardedAd.loaded) {
      // Try to load an ad
      await this.loadRewardedAd();

      // Wait a bit for the ad to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!this.rewardedAd || !this.rewardedAd.loaded) {
        throw new Error('No ad available. Please try again in a moment.');
      }
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
