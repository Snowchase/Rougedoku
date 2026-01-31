/**
 * Mock Ad Service - For testing without native modules
 *
 * This mock simulates ad behavior without requiring Google Mobile Ads native module.
 * Perfect for testing with Expo Go during development.
 *
 * Usage: Automatically used in development mode (see app/_layout.tsx)
 */

export const COINS_PER_AD = 25;

class MockAdService {
  private isInitialized = false;
  private mockAdReady = true;
  private adWatchCount = 0;

  async initialize(): Promise<void> {
    console.log('🧪 Mock AdService initialized (no native modules required)');
    console.log('📱 You can test ads with Expo Go!');
    this.isInitialized = true;

    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return Promise.resolve();
  }

  isRewardedAdReady(): boolean {
    return this.mockAdReady;
  }

  async showRewardedAd(): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('AdService not initialized. Call initialize() first.');
    }

    console.log('🎬 Loading mock ad...');

    // Simulate ad loading delay (2-3 seconds like real ads)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate occasional failures (10% failure rate to test error handling)
    const shouldSucceed = Math.random() > 0.1;

    if (!shouldSucceed) {
      console.log('❌ Mock ad failed to load');
      throw new Error('No ad available. Please try again in a moment.');
    }

    // Successfully "watched" ad
    this.adWatchCount++;
    console.log(`✅ Mock ad completed (${this.adWatchCount} total) - awarding ${COINS_PER_AD} coins`);

    return COINS_PER_AD;
  }

  getRewardAmount(): number {
    return COINS_PER_AD;
  }

  hasRequestedTrackingPermission(): boolean {
    // Mock: always return true since we're not actually tracking
    return true;
  }

  async getConsentStatus(): Promise<number> {
    // Mock: return "not required" status
    return 3;
  }

  // Mock-specific methods for debugging
  getAdWatchCount(): number {
    return this.adWatchCount;
  }

  resetAdWatchCount(): void {
    this.adWatchCount = 0;
    console.log('🔄 Mock ad watch count reset');
  }
}

// Export singleton instance
export const adService = new MockAdService();
