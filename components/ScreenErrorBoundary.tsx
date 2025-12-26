import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorBoundary } from './ErrorBoundary';

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({ children, screenName }: ScreenErrorBoundaryProps) {
  const router = useRouter();

  const fallback = (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Screen Error</Text>
        <Text style={styles.message}>
          {screenName ? `The ${screenName} screen` : 'This screen'} encountered an error.
          {'\n'}Try going back or restarting the app.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    backgroundColor: '#6B7280',
  },
  homeButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
