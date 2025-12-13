import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { generatePuzzle, type SudokuCell } from '../../components/dailyPuzzleGenerator';
import { getFriends, type UserProfile } from '../../components/friendService';

type GameMode = 'ai' | 'friend';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type GameState = 'menu' | 'playing' | 'finished';
type Player = 'player1' | 'player2';

interface PlayerScore {
  name: string;
  score: number;
  correctMoves: number;
  mistakes: number;
  avatar: string;
  color: string;
}

interface VersusGameState {
  board: SudokuCell[][];
  solution: number[][];
  currentPlayer: Player;
  player1: PlayerScore;
  player2: PlayerScore;
  selectedCell: { row: number; col: number } | null;
  startTime: number;
  gameOver: boolean;
  emptyCellsRemaining: number;
}

const DIFFICULTY_CELLS: Record<Difficulty, number> = {
  easy: 35,
  medium: 45,
  hard: 52,
  expert: 58,
};

const POINTS = {
  correct: 10,
  mistake: -5,
  timeBonus: {
    fast: 50,    // Under 3 minutes
    medium: 30,  // Under 5 minutes
    slow: 15,    // Under 10 minutes
  },
  perfectBonus: 50,
};

export default function VersusScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { coins } = useCurrency();

  // Menu state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  // Game state
  const [versusGame, setVersusGame] = useState<VersusGameState | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const startGame = () => {
    const puzzle = generatePuzzle(difficulty);

    // Count empty cells
    let emptyCells = 0;
    puzzle.board.forEach(row => {
      row.forEach(cell => {
        if (!cell.isOriginal) emptyCells++;
      });
    });

    const player2Name = gameMode === 'ai'
      ? 'AI Opponent'
      : (selectedFriend?.username || 'Player 2');

    const player2Avatar = gameMode === 'ai'
      ? '🤖'
      : (selectedFriend?.avatar || '😀');

    const player2Color = gameMode === 'ai'
      ? '#EF4444'
      : (selectedFriend?.profileColor || '#EF4444');

    setVersusGame({
      board: puzzle.board,
      solution: puzzle.solution,
      currentPlayer: 'player1',
      player1: {
        name: 'You',
        score: 0,
        correctMoves: 0,
        mistakes: 0,
        avatar: '😊',
        color: '#3B82F6',
      },
      player2: {
        name: player2Name,
        score: 0,
        correctMoves: 0,
        mistakes: 0,
        avatar: player2Avatar,
        color: player2Color,
      },
      selectedCell: null,
      startTime: Date.now(),
      gameOver: false,
      emptyCellsRemaining: emptyCells,
    });

    setGameState('playing');
  };

  const handleCellPress = (row: number, col: number) => {
    if (!versusGame || versusGame.gameOver) return;

    const cell = versusGame.board[row][col];
    if (cell.isOriginal) return;

    setVersusGame(prev => prev ? {
      ...prev,
      selectedCell: { row, col },
    } : null);
  };

  const handleNumberInput = (num: number) => {
    if (!versusGame || !versusGame.selectedCell || versusGame.gameOver) return;

    const { row, col } = versusGame.selectedCell;
    const cell = versusGame.board[row][col];
    if (cell.isOriginal) return;

    const correctValue = versusGame.solution[row][col];
    const isCorrect = num === correctValue;
    const currentPlayerKey = versusGame.currentPlayer;

    setVersusGame(prev => {
      if (!prev) return null;

      const newBoard = prev.board.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return {
              ...c,
              value: num,
              isCorrect,
              hasError: !isCorrect,
            };
          }
          return c;
        })
      );

      const updatedPlayer = { ...prev[currentPlayerKey] };
      if (isCorrect) {
        updatedPlayer.score += POINTS.correct;
        updatedPlayer.correctMoves += 1;
      } else {
        updatedPlayer.score += POINTS.mistake;
        updatedPlayer.mistakes += 1;
      }

      const newEmptyCells = isCorrect ? prev.emptyCellsRemaining - 1 : prev.emptyCellsRemaining;
      const gameOver = newEmptyCells === 0;

      // Switch player
      const nextPlayer: Player = currentPlayerKey === 'player1' ? 'player2' : 'player1';

      return {
        ...prev,
        board: newBoard,
        [currentPlayerKey]: updatedPlayer,
        currentPlayer: nextPlayer,
        selectedCell: null,
        emptyCellsRemaining: newEmptyCells,
        gameOver,
      };
    });

    // AI makes a move after player
    if (gameMode === 'ai' && versusGame.currentPlayer === 'player1' && !versusGame.gameOver) {
      setTimeout(() => makeAIMove(), 800);
    }
  };

  const makeAIMove = useCallback(() => {
    setVersusGame(prev => {
      if (!prev || prev.gameOver || prev.currentPlayer !== 'player2') return prev;

      // Find an empty cell
      const emptyCells: { row: number; col: number }[] = [];
      prev.board.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (!cell.isOriginal && cell.value === 0) {
            emptyCells.push({ row: ri, col: ci });
          }
        });
      });

      if (emptyCells.length === 0) return prev;

      // AI picks a random empty cell
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const { row, col } = randomCell;
      const correctValue = prev.solution[row][col];

      // AI has 70% chance of getting it right on easy, less on harder difficulties
      const accuracyChance = difficulty === 'easy' ? 0.85 :
                             difficulty === 'medium' ? 0.75 :
                             difficulty === 'hard' ? 0.65 : 0.55;

      const isCorrect = Math.random() < accuracyChance;
      const value = isCorrect ? correctValue : (correctValue % 9) + 1;

      const newBoard = prev.board.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return {
              ...c,
              value,
              isCorrect,
              hasError: !isCorrect,
            };
          }
          return c;
        })
      );

      const updatedPlayer2 = { ...prev.player2 };
      if (isCorrect) {
        updatedPlayer2.score += POINTS.correct;
        updatedPlayer2.correctMoves += 1;
      } else {
        updatedPlayer2.score += POINTS.mistake;
        updatedPlayer2.mistakes += 1;
      }

      const newEmptyCells = isCorrect ? prev.emptyCellsRemaining - 1 : prev.emptyCellsRemaining;
      const gameOver = newEmptyCells === 0;

      return {
        ...prev,
        board: newBoard,
        player2: updatedPlayer2,
        currentPlayer: 'player1',
        emptyCellsRemaining: newEmptyCells,
        gameOver,
      };
    });
  }, [difficulty]);

  const calculateFinalScores = (): { player1: PlayerScore; player2: PlayerScore; winner: string } => {
    if (!versusGame) {
      return {
        player1: { name: '', score: 0, correctMoves: 0, mistakes: 0, avatar: '', color: '' },
        player2: { name: '', score: 0, correctMoves: 0, mistakes: 0, avatar: '', color: '' },
        winner: '',
      };
    }

    const elapsedSeconds = Math.floor((Date.now() - versusGame.startTime) / 1000);

    // Calculate time bonuses
    let timeBonus = 0;
    if (elapsedSeconds < 180) timeBonus = POINTS.timeBonus.fast;
    else if (elapsedSeconds < 300) timeBonus = POINTS.timeBonus.medium;
    else if (elapsedSeconds < 600) timeBonus = POINTS.timeBonus.slow;

    const player1 = { ...versusGame.player1 };
    const player2 = { ...versusGame.player2 };

    // Add time bonus proportionally based on correct moves
    const totalCorrect = player1.correctMoves + player2.correctMoves;
    if (totalCorrect > 0) {
      player1.score += Math.round(timeBonus * (player1.correctMoves / totalCorrect));
      player2.score += Math.round(timeBonus * (player2.correctMoves / totalCorrect));
    }

    // Perfect bonus
    if (player1.mistakes === 0 && player1.correctMoves > 0) {
      player1.score += POINTS.perfectBonus;
    }
    if (player2.mistakes === 0 && player2.correctMoves > 0) {
      player2.score += POINTS.perfectBonus;
    }

    const winner = player1.score > player2.score
      ? player1.name
      : player2.score > player1.score
        ? player2.name
        : 'Tie';

    return { player1, player2, winner };
  };

  const renderMenu = () => (
    <ScrollView style={styles.menuContent} contentContainerStyle={styles.menuContentContainer}>
      {/* Mode Selection */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
          Game Mode
        </Text>
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { borderColor: theme.colors.cellBorder },
              gameMode === 'ai' && { backgroundColor: theme.colors.primaryButton, borderColor: theme.colors.primaryButton },
            ]}
            onPress={() => setGameMode('ai')}
          >
            <Text style={styles.modeIcon}>🤖</Text>
            <Text style={[
              styles.modeText,
              { color: gameMode === 'ai' ? theme.colors.primaryButtonText : theme.colors.textPrimary },
            ]}>
              vs AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { borderColor: theme.colors.cellBorder },
              gameMode === 'friend' && { backgroundColor: theme.colors.primaryButton, borderColor: theme.colors.primaryButton },
            ]}
            onPress={() => setGameMode('friend')}
          >
            <Text style={styles.modeIcon}>👥</Text>
            <Text style={[
              styles.modeText,
              { color: gameMode === 'friend' ? theme.colors.primaryButtonText : theme.colors.textPrimary },
            ]}>
              vs Friend
            </Text>
          </TouchableOpacity>
        </View>

        {gameMode === 'friend' && (
          <TouchableOpacity
            style={[styles.selectFriendButton, { backgroundColor: theme.colors.cellBackground }]}
            onPress={() => setShowFriendPicker(true)}
          >
            <Text style={[styles.selectFriendText, { color: theme.colors.textPrimary }]}>
              {selectedFriend ? `${selectedFriend.avatar || '😀'} ${selectedFriend.username}` : 'Select Friend (Pass & Play)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Difficulty Selection */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
          Difficulty
        </Text>
        <View style={styles.difficultyButtons}>
          {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.difficultyButton,
                { borderColor: theme.colors.cellBorder },
                difficulty === diff && {
                  backgroundColor: theme.colors.primaryButton,
                  borderColor: theme.colors.primaryButton
                },
              ]}
              onPress={() => setDifficulty(diff)}
            >
              <Text style={[
                styles.difficultyText,
                { color: difficulty === diff ? theme.colors.primaryButtonText : theme.colors.textPrimary },
              ]}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rules */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
          How to Play
        </Text>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleIcon}>✅</Text>
          <Text style={[styles.ruleText, { color: theme.colors.textSecondary }]}>
            Correct number: +{POINTS.correct} points
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleIcon}>❌</Text>
          <Text style={[styles.ruleText, { color: theme.colors.textSecondary }]}>
            Mistake: {POINTS.mistake} points
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleIcon}>⏱️</Text>
          <Text style={[styles.ruleText, { color: theme.colors.textSecondary }]}>
            Time bonus for fast completion
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleIcon}>⭐</Text>
          <Text style={[styles.ruleText, { color: theme.colors.textSecondary }]}>
            Perfect bonus (+{POINTS.perfectBonus}) for no mistakes
          </Text>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: theme.colors.primaryButton }]}
        onPress={startGame}
      >
        <Text style={[styles.startButtonText, { color: theme.colors.primaryButtonText }]}>
          Start Battle!
        </Text>
      </TouchableOpacity>

      {/* Friend Picker Modal */}
      <Modal visible={showFriendPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Select Friend
            </Text>
            <ScrollView style={styles.friendList}>
              {friends.length === 0 ? (
                <Text style={[styles.noFriendsText, { color: theme.colors.textSecondary }]}>
                  No friends yet. Add friends in Social tab!
                </Text>
              ) : (
                friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.userId}
                    style={[styles.friendItem, { backgroundColor: theme.colors.cellBackground }]}
                    onPress={() => {
                      setSelectedFriend(friend);
                      setShowFriendPicker(false);
                    }}
                  >
                    <View style={[styles.friendAvatar, { backgroundColor: friend.profileColor || '#3B82F6' }]}>
                      <Text style={styles.friendAvatarText}>{friend.avatar || '😀'}</Text>
                    </View>
                    <Text style={[styles.friendName, { color: theme.colors.textPrimary }]}>
                      {friend.username}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.cellBackground }]}
              onPress={() => setShowFriendPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  const renderGame = () => {
    if (!versusGame) return null;

    const currentPlayerData = versusGame.currentPlayer === 'player1'
      ? versusGame.player1
      : versusGame.player2;

    return (
      <View style={styles.gameContainer}>
        {/* Score Header */}
        <View style={[styles.scoreHeader, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={[
            styles.playerScore,
            versusGame.currentPlayer === 'player1' && styles.activePlayer,
          ]}>
            <Text style={styles.playerAvatar}>{versusGame.player1.avatar}</Text>
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {versusGame.player1.name}
            </Text>
            <Text style={[styles.scoreValue, { color: versusGame.player1.color }]}>
              {versusGame.player1.score}
            </Text>
          </View>
          <View style={styles.vsContainer}>
            <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>VS</Text>
          </View>
          <View style={[
            styles.playerScore,
            versusGame.currentPlayer === 'player2' && styles.activePlayer,
          ]}>
            <Text style={styles.playerAvatar}>{versusGame.player2.avatar}</Text>
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {versusGame.player2.name}
            </Text>
            <Text style={[styles.scoreValue, { color: versusGame.player2.color }]}>
              {versusGame.player2.score}
            </Text>
          </View>
        </View>

        {/* Current Turn Indicator */}
        <View style={[styles.turnIndicator, { backgroundColor: currentPlayerData.color }]}>
          <Text style={styles.turnText}>
            {currentPlayerData.name}'s Turn
          </Text>
        </View>

        {/* Sudoku Board */}
        <View style={[styles.board, { borderColor: theme.colors.gridBorder }]}>
          {versusGame.board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const isSelected = versusGame.selectedCell?.row === rowIndex &&
                                   versusGame.selectedCell?.col === colIndex;
                const isBlockBorder = (colIndex + 1) % 3 === 0 && colIndex < 8;
                const isRowBorder = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: cell.isOriginal
                          ? theme.colors.cellOriginal
                          : theme.colors.cellBackground,
                        borderColor: theme.colors.cellBorder,
                      },
                      isSelected && { backgroundColor: theme.colors.cellSelected },
                      cell.hasError && { backgroundColor: theme.colors.error + '30' },
                      isBlockBorder && styles.cellBlockBorderRight,
                      isRowBorder && styles.cellBlockBorderBottom,
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    disabled={cell.isOriginal || versusGame.gameOver}
                  >
                    {cell.value !== 0 && (
                      <Text style={[
                        styles.cellText,
                        { color: cell.isOriginal ? theme.colors.textPrimary : theme.colors.primaryButton },
                        cell.hasError && { color: theme.colors.error },
                      ]}>
                        {cell.value}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.numberButton, { backgroundColor: theme.colors.cardBackground }]}
              onPress={() => handleNumberInput(num)}
              disabled={versusGame.gameOver || (gameMode === 'ai' && versusGame.currentPlayer === 'player2')}
            >
              <Text style={[styles.numberText, { color: theme.colors.textPrimary }]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderResults = () => {
    const { player1, player2, winner } = calculateFinalScores();

    return (
      <View style={styles.resultsContainer}>
        <View style={[styles.resultsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.resultsTitle, { color: theme.colors.textPrimary }]}>
            Game Over!
          </Text>

          <View style={styles.winnerSection}>
            <Text style={styles.winnerEmoji}>
              {winner === 'Tie' ? '🤝' : '🏆'}
            </Text>
            <Text style={[styles.winnerText, { color: theme.colors.textPrimary }]}>
              {winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}
            </Text>
          </View>

          <View style={styles.finalScores}>
            <View style={[styles.finalScoreCard, { backgroundColor: player1.color + '20' }]}>
              <Text style={styles.finalPlayerAvatar}>{player1.avatar}</Text>
              <Text style={[styles.finalPlayerName, { color: theme.colors.textPrimary }]}>
                {player1.name}
              </Text>
              <Text style={[styles.finalScore, { color: player1.color }]}>
                {player1.score}
              </Text>
              <View style={styles.statsRow}>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  ✅ {player1.correctMoves}
                </Text>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  ❌ {player1.mistakes}
                </Text>
              </View>
              {player1.mistakes === 0 && player1.correctMoves > 0 && (
                <Text style={styles.perfectBadge}>⭐ Perfect!</Text>
              )}
            </View>

            <View style={[styles.finalScoreCard, { backgroundColor: player2.color + '20' }]}>
              <Text style={styles.finalPlayerAvatar}>{player2.avatar}</Text>
              <Text style={[styles.finalPlayerName, { color: theme.colors.textPrimary }]}>
                {player2.name}
              </Text>
              <Text style={[styles.finalScore, { color: player2.color }]}>
                {player2.score}
              </Text>
              <View style={styles.statsRow}>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  ✅ {player2.correctMoves}
                </Text>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  ❌ {player2.mistakes}
                </Text>
              </View>
              {player2.mistakes === 0 && player2.correctMoves > 0 && (
                <Text style={styles.perfectBadge}>⭐ Perfect!</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.playAgainButton, { backgroundColor: theme.colors.primaryButton }]}
            onPress={() => {
              setVersusGame(null);
              setGameState('menu');
            }}
          >
            <Text style={[styles.playAgainText, { color: theme.colors.primaryButtonText }]}>
              Play Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Check for game over
  useEffect(() => {
    if (versusGame?.gameOver && gameState === 'playing') {
      setTimeout(() => setGameState('finished'), 500);
    }
  }, [versusGame?.gameOver, gameState]);

  return (
    <SwipeableScreen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <NavigationHeader title="Versus" />

        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'finished' && renderResults()}
      </View>
    </SwipeableScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContent: {
    flex: 1,
  },
  menuContentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectFriendButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectFriendText: {
    fontSize: 16,
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  friendList: {
    maxHeight: 300,
  },
  noFriendsText: {
    textAlign: 'center',
    padding: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 24,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalCloseButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameContainer: {
    flex: 1,
    padding: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  playerScore: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activePlayer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  playerAvatar: {
    fontSize: 28,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnIndicator: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  board: {
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  cellBlockBorderRight: {
    borderRightWidth: 2,
  },
  cellBlockBorderBottom: {
    borderBottomWidth: 2,
  },
  cellText: {
    fontSize: 18,
    fontWeight: '600',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  numberText: {
    fontSize: 22,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultsCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winnerEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  finalScores: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  finalScoreCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  finalPlayerAvatar: {
    fontSize: 36,
    marginBottom: 8,
  },
  finalPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 14,
  },
  perfectBadge: {
    marginTop: 8,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  playAgainButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
