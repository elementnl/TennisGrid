import { useState, useEffect } from "react";
import { Check, Eye, User } from "lucide-react";
import { getPlayerImageUrl } from "@/utils/playerImage";
import { getPlayerByName } from "@/utils/puzzleGenerator";

function PlayerImage({ playerName }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const player = getPlayerByName(playerName);
    if (!player) { setFailed(true); return; }

    getPlayerImageUrl(player).then((url) => {
      if (url) setImageUrl(url);
      else setFailed(true);
    });
  }, [playerName]);

  // Placeholder — gray background with user icon
  if (failed || (!imageUrl && !loaded)) {
    return (
      <div className="w-3/5 aspect-square max-w-30 border border-primary rounded-lg bg-muted flex items-center justify-center shrink-0">
        <User size={20} className="text-muted-foreground/50" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      {/* Show placeholder while loading */}
      {!loaded && (
        <div className="w-3/5 aspect-square max-w-30 border border-primary rounded-lg bg-muted flex items-center justify-center shrink-0">
          <User size={20} className="text-muted-foreground/50" strokeWidth={1.5} />
        </div>
      )}
      <img
        src={imageUrl}
        alt={playerName}
        className={`w-3/5 aspect-square max-w-30 border border-primary bg-white rounded-lg object-cover shrink-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "absolute opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setImageUrl(null); setFailed(true); }}
      />
    </>
  );
}

export default function Cell({ cellData, onSelect, disabled, rowIdx, colIdx, shaking }) {
  // Correct answer — locked in green
  if (cellData?.correct) {
    return (
      <div className="aspect-square flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl border-2 p-1.5 text-center animate-pop-in bg-success/10 border-success/40">
        <PlayerImage playerName={cellData.playerName} />
        <span className="font-bold text-xs sm:text-sm leading-tight wrap-break-word text-success">
          {cellData.playerName}
        </span>
      </div>
    );
  }

  // Revealed answer (game over, unfilled) — yellow, clickable for more answers
  if (cellData?.revealed) {
    return (
      <div
        className="aspect-square flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl border-2 p-1.5 text-center animate-pop-in bg-amber-500/10 border-amber-500/40 cursor-pointer hover:bg-amber-500/15 transition-all"
        onClick={() => onSelect(rowIdx, colIdx)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelect(rowIdx, colIdx);
        }}
      >
        <PlayerImage playerName={cellData.playerName} />
        <span className="font-bold text-xs sm:text-sm leading-tight wrap-break-word text-amber-600 dark:text-amber-400">
          {cellData.playerName}
        </span>
      </div>
    );
  }

  // Disabled empty cell
  if (disabled) {
    return (
      <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-card opacity-40" />
    );
  }

  // Empty cell — clickable
  return (
    <div
      className={`aspect-square flex items-center justify-center rounded-xl border-2 border-border bg-card shadow-sm cursor-pointer transition-all hover:bg-muted hover:border-primary hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${shaking ? "animate-shake border-destructive/50" : ""}`}
      onClick={() => onSelect(rowIdx, colIdx)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(rowIdx, colIdx);
      }}
    >
      <span className="text-muted-foreground text-xs font-medium opacity-50">
        ?
      </span>
    </div>
  );
}
