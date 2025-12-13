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
import { getUserStats, formatStatsForDisplay, type FormattedStats } from '../../services/statsService';
import StatsDisplay from '../../components/StatsDisplay';
import { useTheme } from '../../contexts/ThemeContext';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';

type TabType = 'stats' | 'allTime' | 'daily';
type ViewType = 'global' | 'friends';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',
};

export default function LeaderboardsScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [viewType, setViewType] = useState<ViewType>('global');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userStats, setUserStats] = useState<FormattedStats | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (activeTab !== 'stats') {
      loadScores();
    }
  }, [activeTab, viewType, difficulty, selectedDate]);

  const initAuth = async () => {
    const user = getCurrentUser();
    if (!user) {
      await initializeUser();
      const newUser = getCurrentUser();
      setCurrentUserId(newUser?.uid || null);
      if (newUser) {
        await loadUserStats(newUser.uid);
      }
    } else {
      setCurrentUserId(user.uid);
      await loadUserStats(user.uid);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const stats = await getUserStats(userId);
      if (stats) {
        const formatted = formatStatsForDisplay(stats);
        setUserStats(formatted);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadScores = async () => {
    setLoading(true);
    try {
      let fetchedScores: DailyScore[] = [];

      if (activeTab === 'allTime') {
        // All-time best scores
        fetchedScores = await getAllTimeBestScores(difficulty, 100);
      } else {
        // Daily scores for selected date
        const dateStr = getDateString(selectedDate);
        if (viewType === 'global') {
          fetchedScores = await getGlobalScores(dateStr, difficulty, 100);
        } else {
          fetchedScores = await getFriendsScores(dateStr, difficulty);
        }
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
    if (activeTab === 'stats' && currentUserId) {
      await loadUserStats(currentUserId);
    } else {
      await loadScores();
    }
    setRefreshing(false);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const today = new Date();
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);

    // Don't allow going past today
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return getDateString(selectedDate) === getDateString(today);
  };

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = getDateString(date);
    const todayStr = getDateString(today);
    const yesterdayStr = getDateString(yesterday);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    // Format as "Mon, Jan 15"
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
          {activeTab === 'allTime' && (
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
    <SwipeableScreen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <NavigationHeader title="Leaderboards" />

        {/* Tab Selector - Stats, All-Time, Daily */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            📊 Your Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'allTime' && styles.tabActive]}
          onPress={() => setActiveTab('allTime')}
        >
          <Text style={[styles.tabText, activeTab === 'allTime' && styles.tabTextActive]}>
            🏆 All-Time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
            📅 Daily
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigation (only for daily) */}
      {activeTab === 'daily' && (
        <View style={styles.dateNavContainer}>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={goToPreviousDay}
          >
            <Text style={styles.dateNavArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.dateCenterContainer}>
            <Text style={styles.dateDisplay}>{formatDisplayDate(selectedDate)}</Text>
            {!isToday() && (
              <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.dateNavButton, isToday() && styles.dateNavButtonDisabled]}
            onPress={goToNextDay}
            disabled={isToday()}
          >
            <Text style={[styles.dateNavArrow, isToday() && styles.dateNavArrowDisabled]}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View Selector - Global vs Friends (only for daily) */}
      {activeTab === 'daily' && (
        <View style={styles.viewContainer}>
          <TouchableOpacity
            style={[styles.viewButton, viewType === 'global' && styles.viewButtonActive]}
            onPress={() => setViewType('global')}
          >
            <Text style={[styles.viewText, viewType === 'global' && styles.viewTextActive]}>
              🌎 Global
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewButton, viewType === 'friends' && styles.viewButtonActive]}
            onPress={() => setViewType('friends')}
          >
            <Text style={[styles.viewText, viewType === 'friends' && styles.viewTextActive]}>
              👥 Friends
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Difficulty Selector (not shown for stats tab) */}
      {activeTab !== 'stats' && (
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
      )}

      {/* Content Area */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'stats' ? (
          // Stats Display
          <View style={styles.statsContainer}>
            {userStats ? (
              <StatsDisplay stats={userStats} theme={theme} />
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primaryButton} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your stats...</Text>
              </View>
            )}
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryButton} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading scores...</Text>
          </View>
        ) : scores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {activeTab === 'allTime'
                ? 'No scores recorded yet.\nComplete a puzzle to appear on the leaderboard!'
                : viewType === 'friends'
                  ? 'No friends have completed this puzzle yet.\nAdd friends to see their scores!'
                  : `No scores yet for ${formatDisplayDate(selectedDate)}.\nBe the first to complete it!`}
            </Text>
          </View>
        ) : (
          <View style={styles.scoresList}>
            {scores.map((score, index) => renderScoreRow(score, index))}
          </View>
        )}
      </ScrollView>
      </View>
    </SwipeableScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateNavButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateNavButtonDisabled: {
    opacity: 0.3,
  },
  dateNavArrow: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  dateNavArrowDisabled: {
    color: '#9CA3AF',
  },
  dateCenterContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  viewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewTextActive: {
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
  statsContainer: {
    padding: 20,
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
