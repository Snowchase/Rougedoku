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
    .activeOffsetX(15) // Start recognizing after 15px horizontal movement
    .failOffsetY([-30, 30]) // Fail if vertical movement exceeds 30px (for scrolling)
    .onUpdate((event) => {
      // Only allow right swipe (positive translationX) starting from left edge area
      if (event.translationX > 0 && event.absoluteX - event.translationX < 80) {
        translateX.value = Math.min(event.translationX, SCREEN_WIDTH * 0.5);
      }
    })
    .onEnd((event) => {
      // Check if we've swiped far enough from the left edge
      const startedFromEdge = event.absoluteX - event.translationX < 80;
      if (event.translationX > SWIPE_THRESHOLD && startedFromEdge) {
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
