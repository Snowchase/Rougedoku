import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from 'react-native-google-mobile-ads';

// Use test IDs during development, replace with real IDs for production
// To get real Ad Unit IDs, create them in your AdMob console: https://admob.google.com
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS rewarded ad unit ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your Android rewarded ad unit ID
    }) || TestIds.REWARDED;

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;

  constructor() {
    this.loadRewardedAd();
  }

  /**
   * Load a rewarded ad
   */
  loadRewardedAd(): void {
    if (this.isLoading || this.isLoaded) return;

    this.isLoading = true;
    this.rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.isLoading = false;
        unsubscribeLoaded();
      }
    );

    const unsubscribeError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Rewarded ad failed to load:', error);
        this.isLoading = false;
        this.isLoaded = false;
        unsubscribeError();
        // Retry loading after a delay
        setTimeout(() => this.loadRewardedAd(), 30000);
      }
    );

    this.rewardedAd.load();
  }

  /**
   * Check if a rewarded ad is ready to show
   */
  isRewardedAdReady(): boolean {
    return this.isLoaded && this.rewardedAd !== null;
  }

  /**
   * Show a rewarded ad
   * @returns Promise that resolves with true if user earned reward, false otherwise
   */
  async showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.rewardedAd || !this.isLoaded) {
        console.log('Rewarded ad not ready');
        resolve(false);
        return;
      }

      let earned = false;

      const unsubscribeEarned = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('User earned reward:', reward);
          earned = true;
        }
      );

      const unsubscribeClosed = this.rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubscribeEarned();
          unsubscribeClosed();

          // Reset state and load next ad
          this.isLoaded = false;
          this.rewardedAd = null;
          this.loadRewardedAd();

          resolve(earned);
        }
      );

      this.rewardedAd.show();
    });
  }
}

// Export singleton instance
export const adService = new AdService();
