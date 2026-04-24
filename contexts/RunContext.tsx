// RunContext.tsx
// React context that exposes active run state and all run operations
// to the game screen hierarchy.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  type RunState,
  type FloorState,
  type TileEvent,
  type FloorReward,
  type UpgradeId,
} from '../constants/runConfig';
import {
  createRun,
  getActiveRun,
  getFloorState,
  saveRunState,
  clearRunState,
  advanceFloor,
  applyTileEffect,
  calculateFloorReward,
  calculateRunCompletionBonus,
  rollUpgradeOptions,
  surgeonForgivesThisMistake,
  generateFloorState,
  getNewlyCompletedSections,
  scoreNewSections,
  scoreCorrectPlacement,
  scorePerfectClear,
} from '../services/runService';

// ─── Context Type ─────────────────────────────────────────────────────────────

interface RunContextType {
  /** The current active run, or null if no run is in progress. */
  activeRun: RunState | null;

  /** The current floor state (puzzle + modifiers). */
  floorState: FloorState | null;

  /** True while initial async load from storage is happening. */
  isLoading: boolean;

  /** Starts a brand-new run, replacing any existing run. */
  startNewRun: () => Promise<void>;

  /** Loads the persisted active run (called on app resume). */
  resumeRun: () => Promise<void>;

  /** Discards the active run permanently. */
  abandonRun: () => Promise<void>;

  /**
   * Persists live grid/notes/time changes from SudokuGrid.
   * Called on every cell fill and on app-background events.
   */
  updateFloorProgress: (updates: Partial<Pick<FloorState,
    'grid' | 'notes' | 'elapsedTime' | 'mistakesThisFloor' | 'hintsUsedThisFloor'
  >>) => Promise<void>;

  /**
   * Resolves a tile effect when a cell is filled.
   * Returns the TileEvent (for animation) and any immediately awarded coins.
   * Also updates run+floor state and persists.
   */
  triggerTileEffect: (
    cellKey: string,
    correct: boolean,
  ) => Promise<{ event: TileEvent | null; coinsDelta: number; revealCellKey?: string }>;

  /**
   * Applies a mistake to the run (from a rule violation in SudokuGrid).
   * Handles surgeon-upgrade forgiveness and double_edge modifier.
   * Returns how many lives were actually lost (0 if forgiven).
   */
  recordMistake: () => Promise<number>;

  /**
   * Uses one hint from the run hint pool.
   * Returns false if no hints remain or floor modifier blocks hints.
   */
  useHint: () => Promise<boolean>;

  /**
   * Calculates the reward for the completed floor and moves to the next floor.
   * Returns the FloorReward for display and an array of upgrade choices.
   * Caller must call selectUpgrade() or skipUpgrade() to finalise.
   */
  completeFloor: () => Promise<{ reward: FloorReward; upgradeChoices: UpgradeId[] }>;

  /**
   * Selects an upgrade from the draft and generates the next floor.
   * Pass the reward total from completeFloor() so it gets recorded correctly.
   * If the completed floor was the last one, finalises the run as 'completed'.
   */
  selectUpgrade: (upgradeId: UpgradeId | null, floorRewardCoins: number) => Promise<{ runComplete: boolean }>;

  /**
   * Ends the run as failed (called when livesRemaining reaches 0).
   */
  failRun: () => Promise<void>;

  /**
   * Scores newly completed sections after a correct cell placement.
   * Also applies Comboist per-placement scoring.
   * Returns total score gained and whether the threshold was just crossed.
   */
  scoreSection: (
    grid: number[][],
    row: number,
    col: number,
  ) => Promise<{ scoreGained: number; thresholdJustReached: boolean }>;

  /**
   * Applies the Completionist perfect-clear bonus (called when full board is correct).
   * No-op if upgrade is not owned. Returns coins gained.
   */
  applyPerfectClearBonus: () => Promise<{ scoreGained: number }>;

  /** Returns true if an active run exists in storage (for home screen). */
  hasActiveRun: boolean;
}

// ─── Context & Hook ───────────────────────────────────────────────────────────

const RunContext = createContext<RunContextType | undefined>(undefined);

export function useRun(): RunContextType {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error('useRun must be used inside RunProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RunProvider({ children }: { children: ReactNode }) {
  const [activeRun, setActiveRun] = useState<RunState | null>(null);
  const [floorState, setFloorState] = useState<FloorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initial Load ────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const run = await getActiveRun();
      if (run) {
        const floor = await getFloorState();
        setActiveRun(run);
        setFloorState(floor);
      }
      setIsLoading(false);
    })();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Sync both states to React and AsyncStorage in one call. */
  const syncState = useCallback(async (run: RunState, floor: FloorState) => {
    setActiveRun(run);
    setFloorState(floor);
    await saveRunState(run, floor);
  }, []);

  // ── Run Lifecycle ───────────────────────────────────────────────────────────

  const startNewRun = useCallback(async () => {
    const { run, floor } = await createRun();
    setActiveRun(run);
    setFloorState(floor);
  }, []);

  const resumeRun = useCallback(async () => {
    const run = await getActiveRun();
    if (!run) return;
    const floor = await getFloorState();
    setActiveRun(run);
    setFloorState(floor);
  }, []);

  const abandonRun = useCallback(async () => {
    await clearRunState();
    setActiveRun(null);
    setFloorState(null);
  }, []);

  // ── Grid Progress Sync ──────────────────────────────────────────────────────

  const updateFloorProgress = useCallback(async (
    updates: Partial<Pick<FloorState,
      'grid' | 'notes' | 'elapsedTime' | 'mistakesThisFloor' | 'hintsUsedThisFloor'
    >>,
  ) => {
    if (!activeRun || !floorState) return;
    const updated = { ...floorState, ...updates };
    setFloorState(updated);
    await saveRunState(activeRun, updated);
  }, [activeRun, floorState]);

  // ── Tile Effects ────────────────────────────────────────────────────────────

  const triggerTileEffect = useCallback(async (
    cellKey: string,
    correct: boolean,
  ): Promise<{ event: TileEvent | null; coinsDelta: number; revealCellKey?: string }> => {
    if (!activeRun || !floorState) {
      return { event: null, coinsDelta: 0 };
    }

    const result = applyTileEffect(activeRun, floorState, cellKey, correct);

    let finalRun = result.updatedRun;
    let finalFloor = result.updatedFloor;

    // If a hint tile revealed a cell, apply it to the grid
    if (result.revealCellKey) {
      const [r, c] = result.revealCellKey.split('-').map(Number);
      const solutionValue = floorState.solution[r][c];
      const newGrid = finalFloor.grid.map(row => [...row]);
      newGrid[r][c] = solutionValue;
      finalFloor = { ...finalFloor, grid: newGrid };
    }

    await syncState(finalRun, finalFloor);

    return {
      event: result.event,
      coinsDelta: result.coinsDelta,
      revealCellKey: result.revealCellKey,
    };
  }, [activeRun, floorState, syncState]);

  // ── Mistakes ────────────────────────────────────────────────────────────────

  const recordMistake = useCallback(async (): Promise<number> => {
    if (!activeRun || !floorState) return 0;

    // Surgeon upgrade forgives the first mistake of each floor
    if (surgeonForgivesThisMistake(activeRun, floorState)) {
      // Still record it in floor stats but don't deduct a life
      const updatedFloor = {
        ...floorState,
        mistakesThisFloor: floorState.mistakesThisFloor + 1,
      };
      const updatedRun = {
        ...activeRun,
        totalMistakes: activeRun.totalMistakes + 1,
      };
      await syncState(updatedRun, updatedFloor);
      return 0;
    }

    const hasDoubleEdge = floorState.floorModifiers.includes('double_edge');
    const livesLost = hasDoubleEdge ? 2 : 1;
    const newLives = Math.max(0, activeRun.livesRemaining - livesLost);

    const updatedRun: RunState = {
      ...activeRun,
      livesRemaining: newLives,
      totalMistakes: activeRun.totalMistakes + 1,
    };
    const updatedFloor: FloorState = {
      ...floorState,
      mistakesThisFloor: floorState.mistakesThisFloor + 1,
    };

    await syncState(updatedRun, updatedFloor);
    return livesLost;
  }, [activeRun, floorState, syncState]);

  // ── Hints ───────────────────────────────────────────────────────────────────

  const useHint = useCallback(async (): Promise<boolean> => {
    if (!activeRun || !floorState) return false;

    // no_hints floor modifier blocks usage
    if (floorState.floorModifiers.includes('no_hints')) return false;

    if (activeRun.hintsRemaining <= 0) return false;

    const updatedRun: RunState = {
      ...activeRun,
      hintsRemaining: activeRun.hintsRemaining - 1,
    };
    const updatedFloor: FloorState = {
      ...floorState,
      hintsUsedThisFloor: floorState.hintsUsedThisFloor + 1,
    };

    await syncState(updatedRun, updatedFloor);
    return true;
  }, [activeRun, floorState, syncState]);

  // ── Floor Completion ────────────────────────────────────────────────────────

  const completeFloor = useCallback(async (): Promise<{
    reward: FloorReward;
    upgradeChoices: UpgradeId[];
  }> => {
    if (!activeRun || !floorState) {
      return { reward: { base: 0, goldBonus: 0, bonusTileFlat: 0, scoreBonus: 0, speedBonus: 0, total: 0 }, upgradeChoices: [] };
    }

    const completedFloor = { ...floorState, isComplete: true };
    const reward = calculateFloorReward(completedFloor, activeRun);
    const upgradeChoices = rollUpgradeOptions(activeRun);

    // Only persist isComplete; floorRewards is written in selectUpgrade so it
    // isn't double-counted when advanceFloor() records the reward.
    await syncState(activeRun, completedFloor);

    return { reward, upgradeChoices };
  }, [activeRun, floorState, syncState]);

  // ── Upgrade Selection ───────────────────────────────────────────────────────

  const selectUpgrade = useCallback(async (
    upgradeId: UpgradeId | null,
    floorRewardCoins: number,
  ): Promise<{ runComplete: boolean }> => {
    if (!activeRun || !floorState) return { runComplete: false };

    // Apply the upgrade (null = skip / no upgrade this round)
    let updatedRun: RunState = upgradeId
      ? { ...activeRun, runUpgrades: [...activeRun.runUpgrades, upgradeId] }
      : { ...activeRun };

    // Resilient upgrade: also increase max life cap
    if (upgradeId === 'resilient') {
      updatedRun = {
        ...updatedRun,
        maxLives: updatedRun.maxLives + 1,
        livesRemaining: Math.min(updatedRun.livesRemaining + 1, updatedRun.maxLives + 1),
      };
    }

    // Check if this was the final floor
    if (activeRun.currentFloor >= activeRun.maxFloors) {
      updatedRun = { ...updatedRun, status: 'completed' };
      await saveRunState(updatedRun, floorState);
      setActiveRun(updatedRun);
      return { runComplete: true };
    }

    // Record this floor's reward and advance to the next floor
    const { updatedRun: runWithNextFloor, nextFloor } = advanceFloor(updatedRun, floorRewardCoins);
    await syncState(runWithNextFloor, nextFloor);
    return { runComplete: false };
  }, [activeRun, floorState, syncState]);

  // ── Section Scoring ─────────────────────────────────────────────────────────

  const scoreSection = useCallback(async (
    grid: number[][],
    row: number,
    col: number,
  ): Promise<{ scoreGained: number; thresholdJustReached: boolean }> => {
    if (!activeRun || !floorState) return { scoreGained: 0, thresholdJustReached: false };

    const wasThresholdReached = floorState.thresholdReached;

    // Score newly completed rows/cols/boxes
    const newSections = getNewlyCompletedSections(
      grid, floorState.solution, row, col, floorState.sectionsCompleted,
    );
    const sectionResult = scoreNewSections(newSections, floorState, activeRun);

    // Comboist: score the individual correct placement on top
    const comboistResult = scoreCorrectPlacement(sectionResult.updatedFloor, activeRun);

    const totalScoreGained = sectionResult.scoreGained + comboistResult.scoreGained;
    const finalFloor = comboistResult.updatedFloor;
    const thresholdJustReached = !wasThresholdReached && finalFloor.thresholdReached;

    if (totalScoreGained > 0 || thresholdJustReached) {
      await syncState(activeRun, finalFloor);
    }

    return { scoreGained: totalScoreGained, thresholdJustReached };
  }, [activeRun, floorState, syncState]);

  const applyPerfectClearBonus = useCallback(async (): Promise<{ scoreGained: number }> => {
    if (!activeRun || !floorState) return { scoreGained: 0 };

    const { scoreGained, updatedFloor } = scorePerfectClear(floorState, activeRun);
    if (scoreGained > 0) {
      await syncState(activeRun, updatedFloor);
    }
    return { scoreGained };
  }, [activeRun, floorState, syncState]);

  // ── Run Failure ─────────────────────────────────────────────────────────────

  const failRun = useCallback(async () => {
    if (!activeRun || !floorState) return;
    const updatedRun: RunState = { ...activeRun, status: 'failed' };
    await saveRunState(updatedRun, floorState);
    setActiveRun(updatedRun);
  }, [activeRun, floorState]);

  // ── Context Value ────────────────────────────────────────────────────────────

  const value: RunContextType = {
    activeRun,
    floorState,
    isLoading,
    startNewRun,
    resumeRun,
    abandonRun,
    updateFloorProgress,
    triggerTileEffect,
    recordMistake,
    useHint,
    completeFloor,
    selectUpgrade,
    failRun,
    scoreSection,
    applyPerfectClearBonus,
    hasActiveRun: activeRun !== null && activeRun.status === 'active',
  };

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}
