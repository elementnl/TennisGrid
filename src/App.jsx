import { useState, useMemo, useCallback } from "react";
import Grid from "@/components/Grid";
import GameHeader from "@/components/GameHeader";
import GuessModal from "@/components/GuessModal";
import AnswersDialog from "@/components/AnswersDialog";
import SettingsDialog from "@/components/SettingsDialog";
import { generatePuzzle, isPlayerValidForCell, getPlayerByName, getValidPlayersForCell, getCategoryDisplayValue } from "@/utils/puzzleGenerator";
import { getTodayString } from "@/utils/seededRandom";
import { useGameState } from "@/hooks/useGameState";
import { useSettings } from "@/hooks/useSettings";

function addDays(dateStr, days) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function App() {
  const today = getTodayString();
  const [currentDate, setCurrentDate] = useState(today);
  const isToday = currentDate === today;
  const { theme, setTheme, units, setUnits } = useSettings();

  const [selectedCell, setSelectedCell] = useState(null);
  const [answersCell, setAnswersCell] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const puzzle = useMemo(() => generatePuzzle(currentDate), [currentDate]);
  const gameState = useGameState(currentDate);

  // Resolve display values for categories based on units
  const displayPuzzle = useMemo(() => ({
    ...puzzle,
    rows: puzzle.rows.map((cat) => ({ ...cat, value: getCategoryDisplayValue(cat, units) })),
    cols: puzzle.cols.map((cat) => ({ ...cat, value: getCategoryDisplayValue(cat, units) })),
  }), [puzzle, units]);

  const displayGrid = useMemo(() => {
    if (!gameState.isComplete) return gameState.grid;

    return gameState.grid.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (cell?.correct) return cell;

        const rowCat = puzzle.rows[rowIdx];
        const colCat = puzzle.cols[colIdx];
        const validPlayers = getValidPlayersForCell(rowCat, colCat);

        if (validPlayers.length > 0) {
          return {
            playerName: validPlayers[0].name,
            correct: false,
            revealed: true,
          };
        }

        return cell;
      })
    );
  }, [gameState.isComplete, gameState.grid, puzzle]);

  const displayGameState = useMemo(() => ({
    ...gameState,
    grid: displayGrid,
  }), [gameState, displayGrid]);

  const handleCellSelect = useCallback(
    (row, col) => {
      if (gameState.isComplete) {
        const cell = displayGrid[row][col];
        if (cell?.revealed) {
          setAnswersCell({ row, col });
        }
        return;
      }

      if (!gameState.grid[row][col]) {
        setSelectedCell({ row, col });
      }
    },
    [gameState.isComplete, gameState.grid, displayGrid]
  );

  const usedPlayers = useMemo(() => {
    const used = new Set();
    gameState.grid.flat().forEach((cell) => {
      if (cell?.correct) {
        used.add(cell.playerName);
      }
    });
    return used;
  }, [gameState.grid]);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [shakingCell, setShakingCell] = useState(null);

  const handleGuessSubmit = useCallback(
    (playerName) => {
      if (!selectedCell) return;

      const player = getPlayerByName(playerName);
      if (player && usedPlayers.has(player.name)) {
        setDuplicateWarning(player.name);
        setTimeout(() => setDuplicateWarning(null), 2500);
        return;
      }

      const { row, col } = selectedCell;
      const rowCat = puzzle.rows[row];
      const colCat = puzzle.cols[col];
      const isCorrect = isPlayerValidForCell(playerName, rowCat, colCat);

      const matchedPlayer = getPlayerByName(playerName);
      const displayName = matchedPlayer ? matchedPlayer.name : playerName;

      gameState.makeGuess(row, col, displayName, isCorrect);
      setSelectedCell(null);

      if (!isCorrect) {
        setShakingCell({ row, col });
        setTimeout(() => setShakingCell(null), 500);
      }
    },
    [selectedCell, puzzle, gameState, usedPlayers]
  );

  const handlePrevDay = () => {
    setCurrentDate((d) => addDays(d, -1));
    setSelectedCell(null);
    setAnswersCell(null);
  };
  const handleNextDay = () => {
    if (!isToday) {
      setCurrentDate((d) => addDays(d, 1));
      setSelectedCell(null);
      setAnswersCell(null);
    }
  };

  const answersPlayerList = useMemo(() => {
    if (!answersCell) return [];
    const { row, col } = answersCell;
    const rowCat = puzzle.rows[row];
    const colCat = puzzle.cols[col];
    return getValidPlayersForCell(rowCat, colCat);
  }, [answersCell, puzzle]);

  return (
    <div className="max-w-150 mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-dvh flex flex-col gap-5 sm:gap-7">
      <GameHeader
        dateStr={currentDate}
        guessesRemaining={gameState.guessesRemaining}
        score={gameState.score}
        isComplete={gameState.isComplete}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        isToday={isToday}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Grid
        puzzle={displayPuzzle}
        gameState={displayGameState}
        onCellSelect={handleCellSelect}
        shakingCell={shakingCell}
      />

      <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center -mt-1 max-w-md mx-auto">
        Data includes singles results from 1968 through the 2024 season. Doubles achievements and 2025+ results are not included.
      </p>

      {selectedCell && (
        <GuessModal
          rowCategory={displayPuzzle.rows[selectedCell.row]}
          colCategory={displayPuzzle.cols[selectedCell.col]}
          onSubmit={handleGuessSubmit}
          onClose={() => setSelectedCell(null)}
          usedPlayers={usedPlayers}
          duplicateWarning={duplicateWarning}
        />
      )}

      {answersCell && (
        <AnswersDialog
          validPlayers={answersPlayerList}
          rowCategory={displayPuzzle.rows[answersCell.row]}
          colCategory={displayPuzzle.cols[answersCell.col]}
          onClose={() => setAnswersCell(null)}
        />
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        units={units}
        setUnits={setUnits}
      />
    </div>
  );
}
