# Changelog

All notable changes to Sudokle will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-11

### Added
- **Multiple Solution Support**: Game now accepts all valid Sudoku solutions instead of only one specific solution
  - Addresses forced fork/forced split scenarios where puzzles may have multiple valid solutions
  - Players won't receive false "incorrect" alerts when placing valid numbers
  - Validation now based on Sudoku rules (no duplicates in row/column/box) rather than comparison to stored solution
- **Visual Highlighting Enhancements**: Added row, column, and 3x3 box highlighting
  - When a cell is selected, all cells in the same row are highlighted
  - All cells in the same column are highlighted
  - All cells in the same 3x3 box are highlighted
  - Theme-aware highlighting colors:
    - Light themes: Subtle blue tint (rgba(59, 130, 246, 0.08))
    - Dark themes: Brighter blue tint (rgba(59, 130, 246, 0.15))
  - Helps visualize Sudoku constraints and reduces placement errors

### Changed
- **Move Validation Logic**: Updated from solution-comparison to rule-based validation
  - Error messages now read "Rule Violation" instead of "Incorrect"
  - More descriptive feedback: "This number conflicts with another in the same row, column, or box!"
  - Only shows errors when a placement violates actual Sudoku rules
- **Completion Check**: Now verifies board validity using comprehensive rule checking
  - Checks all rows, columns, and 3x3 boxes for completeness and correctness
  - Accepts any valid solution, not just the originally stored one

### Technical
- Added `isValid()` function export for rule-based placement validation
- Added `countSolutions()` function to detect puzzles with multiple solutions
- Added `isCompleteBoardValid()` function to verify completed board correctness
- Improved cell highlighting priority system for better visual feedback
- Enhanced code documentation and comments

### Version Updates
- App version: 1.0.6 → 1.1.0
- iOS build number: 2 → 3
- Android version code: 3 → 4

## [1.0.6] - Previous Release

### Features
- Daily Sudoku puzzles with four difficulty levels (Easy, Medium, Hard, Expert)
- Multiple color themes and customization options
- Friends system and leaderboards
- Coin economy system with in-app shop
- Hints, notes mode, and timer
- Background music and sound effects
- Haptic feedback
- Profile avatars and customization

---

## Version History

- **1.1.0**: Multiple solution support + visual highlighting enhancements
- **1.0.6**: Previous stable release
- **1.0.2**: Earlier release (documented in README)

---

## Upgrade Notes

### For Users
- Existing saved games will continue to work with the new validation system
- The new highlighting feature will be available immediately
- No action required on user's part

### For Developers
- If integrating with this codebase, note that move validation now uses `isValid()` from `dailyPuzzleGenerator.ts`
- The `solution` array is still stored but only used as a reference, not for strict validation
- Completion checking now uses `isCompleteBoardValid()` instead of direct array comparison

---

## Credits

Developed by the Sudokle Team
Lead Developer: Robert Edie
