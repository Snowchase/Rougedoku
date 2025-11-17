import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  getGlobalScores,
  getFriendsScores,
  getAllTimeBestScores,
  initializeUser,
  getCurrentUser,
  type DailyScore
} from '../../components/friendService';
import { getDateString } from '../../components/dailyPuzzleGenerator';

type TabType = 'global' | 'friends';
type TimeframeType = 'today' | 'allTime';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',
};

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [timeframe, setTimeframe] = useState<TimeframeType>('today');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    loadScores();
  }, [activeTab, timeframe, difficulty]);

  const initAuth = async () => {
    const user = getCurrentUser();
    if (!user) {
      await initializeUser();
      const newUser = getCurrentUser();
      setCurrentUserId(newUser?.uid || null);
    } else {
      setCurrentUserId(user.uid);
    }
  };

  const loadScores = async () => {
    setLoading(true);
    try {
      const today = getDateString();
      let fetchedScores: DailyScore[] = [];

      if (activeTab === 'global') {
        if (timeframe === 'today') {
          fetchedScores = await getGlobalScores(today, difficulty, 100);
        } else {
          fetchedScores = await getAllTimeBestScores(difficulty, 100);
        }
      } else {
        // Friends tab - always shows today's scores
        fetchedScores = await getFriendsScores(today, difficulty);
      }

      setScores(fetchedScores);
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScores();
    setRefreshing(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const renderScoreRow = (score: DailyScore, index: number) => {
    const isCurrentUser = score.userId === currentUserId;
    const rank = index + 1;
    const avatar = score.avatar || '😀';
    const profileColor = score.profileColor || '#3B82F6';

    return (
      <View
        key={`${score.userId}-${score.date}-${score.difficulty}`}
        style={[
          styles.scoreRow,
          isCurrentUser && styles.scoreRowHighlight,
          rank <= 3 && styles.scoreRowTopThree,
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, rank <= 3 && styles.rankTextMedal]}>
            {getMedalEmoji(rank)}
          </Text>
        </View>

        <View style={[styles.avatarContainer, { backgroundColor: profileColor }]}>
          <Text style={styles.avatarEmoji}>{avatar}</Text>
        </View>

        <View style={styles.scoreInfo}>
          <Text style={[styles.username, isCurrentUser && styles.usernameHighlight]}>
            {score.username}
            {isCurrentUser && ' (You)'}
          </Text>
          {timeframe === 'allTime' && (
            <Text style={styles.dateText}>{score.date}</Text>
          )}
        </View>

        <View style={styles.scoreStats}>
          <Text style={[styles.timeText, isCurrentUser && styles.timeTextHighlight]}>
            {formatTime(score.timeSeconds)}
          </Text>
          <Text style={styles.hintsText}>{score.hintsUsed} 💡</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboards</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.tabActive]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
            🌎 Global
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeframe Selector (only for global) */}
      {activeTab === 'global' && (
        <View style={styles.timeframeContainer}>
          <TouchableOpacity
            style={[styles.timeframeButton, timeframe === 'today' && styles.timeframeButtonActive]}
            onPress={() => setTimeframe('today')}
          >
            <Text style={[styles.timeframeText, timeframe === 'today' && styles.timeframeTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeframeButton, timeframe === 'allTime' && styles.timeframeButtonActive]}
            onPress={() => setTimeframe('allTime')}
          >
            <Text style={[styles.timeframeText, timeframe === 'allTime' && styles.timeframeTextActive]}>
              All-Time Best
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Difficulty Selector */}
      <View style={styles.difficultyContainer}>
        {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.difficultyButton,
              difficulty === diff && {
                backgroundColor: DIFFICULTY_COLORS[diff],
                borderColor: DIFFICULTY_COLORS[diff],
              },
            ]}
            onPress={() => setDifficulty(diff)}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === diff && styles.difficultyTextActive,
              ]}
            >
              {diff.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scores List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading scores...</Text>
          </View>
        ) : scores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'friends'
                ? 'No friends have completed this puzzle yet.\nAdd friends to see their scores!'
                : 'No scores yet for this puzzle.\nBe the first to complete it!'}
            </Text>
          </View>
        ) : (
          <View style={styles.scoresList}>
            {scores.map((score, index) => renderScoreRow(score, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeframeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeframeTextActive: {
    color: '#3B82F6',
  },
  difficultyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  difficultyTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scoresList: {
    padding: 16,
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreRowHighlight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  scoreRowTopThree: {
    backgroundColor: '#FFFBEB',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  rankTextMedal: {
    fontSize: 24,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  usernameHighlight: {
    color: '#3B82F6',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scoreStats: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timeTextHighlight: {
    color: '#3B82F6',
  },
  hintsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
