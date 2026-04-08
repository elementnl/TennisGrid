import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY_PREFIX = "tennisGrid_";
const MAX_GUESSES = 9;

function loadState(dateStr) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + dateStr);
    if (saved) return JSON.parse(saved);
  } catch {
  }
  return null;
}

function saveState(dateStr, state) {
  localStorage.setItem(STORAGE_KEY_PREFIX + dateStr, JSON.stringify(state));
}

function createInitialState() {
  return {
    grid: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    guessesUsed: 0,
    isComplete: false,
    score: 0,
  };
}

export function useGameState(dateStr) {
  const [state, setState] = useState(() => {
    return loadState(dateStr) || createInitialState();
  });

  useEffect(() => {
    setState(loadState(dateStr) || createInitialState());
  }, [dateStr]);

  const makeGuess = useCallback(
    (row, col, playerName, isCorrect) => {
      setState((prev) => {
        if (prev.isComplete) return prev;
        if (prev.grid[row][col]?.correct) return prev;

        const newGrid = prev.grid.map((r) => [...r]);

        if (isCorrect) {
          newGrid[row][col] = { playerName, correct: true };
        }

        const newGuessesUsed = prev.guessesUsed + 1;
        const newScore = prev.score + (isCorrect ? 1 : 0);

        const allCorrect = newGrid.flat().every((cell) => cell?.correct);
        const isComplete = newGuessesUsed >= MAX_GUESSES || allCorrect;

        const newState = {
          grid: newGrid,
          guessesUsed: newGuessesUsed,
          isComplete,
          score: newScore,
        };

        saveState(dateStr, newState);
        return newState;
      });
    },
    [dateStr]
  );

  const resetGame = useCallback(() => {
    const initial = createInitialState();
    saveState(dateStr, initial);
    setState(initial);
  }, [dateStr]);

  return {
    ...state,
    makeGuess,
    resetGame,
    maxGuesses: MAX_GUESSES,
    guessesRemaining: MAX_GUESSES - state.guessesUsed,
  };
}
