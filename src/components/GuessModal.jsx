import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { players } from "@/utils/puzzleGenerator";
import CategoryValue from "@/components/CategoryValue";

export default function GuessModal({ rowCategory, colCategory, onSubmit, onClose, usedPlayers = new Set(), duplicateWarning }) {
  const [input, setInput] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const allPlayers = useMemo(() => {
    return players.map((p) => ({
      name: p.name,
      country: p.country,
      tour: p.tour,
    }));
  }, []);

  const suggestions = useMemo(() => {
    const query = input.toLowerCase().trim();
    if (!query) return [];
    return allPlayers
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [input, allPlayers]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex]);

  const selectPlayer = (playerName) => {
    setInput(playerName);
    onSubmit(playerName);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectPlayer(suggestions[highlightIndex].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Make a Guess</DialogTitle>
          <DialogDescription>
            Name a player that matches both categories
          </DialogDescription>
        </DialogHeader>

        {/* Category clues */}
        <div className="flex items-stretch gap-2">
          <div className="flex flex-col items-center justify-center px-3 py-3 bg-muted rounded-lg flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              {rowCategory.label}
            </span>
            <CategoryValue category={rowCategory} className="text-sm font-bold text-primary leading-snug uppercase text-center" />
          </div>
          <div className="flex items-center shrink-0">
            <span className="text-muted-foreground text-sm">&</span>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-3 bg-muted rounded-lg flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              {colCategory.label}
            </span>
            <CategoryValue category={colCategory} className="text-sm font-bold text-primary leading-snug uppercase text-center" />
          </div>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a player's name..."
              autoComplete="off"
              spellCheck="false"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-autocomplete="list"
            />

            {/* Autocomplete dropdown */}
            {suggestions.length > 0 && (
              <ul
                ref={listRef}
                className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto p-1"
                role="listbox"
              >
                {suggestions.map((player, i) => {
                  const isUsed = usedPlayers.has(player.name);
                  return (
                    <li
                      key={player.name}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                        isUsed
                          ? "opacity-40 cursor-not-allowed"
                          : `cursor-pointer ${i === highlightIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                      }`}
                      onClick={() => !isUsed && selectPlayer(player.name)}
                      role="option"
                      aria-selected={i === highlightIndex}
                    >
                      <span className="font-medium">
                        {player.name}
                        {isUsed && <span className="text-xs font-normal text-muted-foreground ml-1.5">(used)</span>}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {player.country} · {player.tour.toUpperCase()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button type="submit" disabled={!input.trim()}>
            Submit Guess
          </Button>
        </form>

        {duplicateWarning ? (
          <p className="text-center text-xs text-destructive font-semibold">
            You already used {duplicateWarning}!
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Type to search, use arrow keys to navigate
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
