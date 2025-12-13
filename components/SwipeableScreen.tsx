import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableScreenProps {
  children: ReactNode;
  enabled?: boolean;
}

export function SwipeableScreen({ children, enabled = true }: SwipeableScreenProps) {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const goBack = () => {
    router.push('/');
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(20) // Start recognizing after 20px horizontal movement
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px (for scrolling)
    .onUpdate((event) => {
      // Only allow right swipe (positive translationX) starting from left edge
      if (event.translationX > 0 && event.x < 50) {
        translateX.value = Math.min(event.translationX, SCREEN_WIDTH * 0.5);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD && event.x < 100) {
        // Swipe threshold reached, navigate back
        translateX.value = withSpring(SCREEN_WIDTH, { damping: 20 });
        runOnJS(goBack)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
