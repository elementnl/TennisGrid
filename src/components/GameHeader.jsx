import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import TennisBallLogo from "./TennisBallLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function GameHeader({
  dateStr,
  guessesRemaining,
  score,
  isComplete,
  onPrevDay,
  onNextDay,
  isToday,
  onOpenSettings,
  onGiveUp,
}) {
  const [showGiveUp, setShowGiveUp] = useState(false);
  const dateObj = new Date(dateStr + "T00:00:00");
  const formatted = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="text-center animate-fade-in">
      {/* Settings cog — fixed top-right on desktop, bottom-right on mobile */}
      <div className="fixed top-4 right-4 z-40 hidden sm:flex items-center gap-1">
        <a
          href="https://github.com/elementnl/TennisGrid"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Button variant="ghost" size="icon" asChild>
            <span><img src="/github.svg" alt="" className="w-4.5 h-4.5 opacity-60 hover:opacity-100 transition-opacity dark:invert" /></span>
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <Settings size={18} />
        </Button>
      </div>

      {/* Logo */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <TennisBallLogo
          size={34}
          className="text-primary animate-pulse-glow mb-1.5 sm:mb-2 w-6 h-6 sm:w-8.5 sm:h-8.5"
        />
        <h1 className="italic font-heading text-3xl sm:text-5xl tracking-tight bg-linear-to-br from-primary to-primary/60 bg-clip-text p-2 text-transparent font-black">
          <span className="font-thin">TENNIS</span>GRID
        </h1>
      </div>

      <p className="text-xs sm:text-[13px] text-muted-foreground tracking-wide mb-4">
        Name players that match both categories
      </p>

      {/* Date nav */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevDay}
          className="h-8 w-8 rounded-lg"
          aria-label="Previous day"
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm text-foreground font-medium min-w-36 sm:min-w-40 tabular-nums">
          {formatted}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextDay}
          disabled={isToday}
          className="h-8 w-8 rounded-lg"
          aria-label="Next day"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[13px] px-3 py-1 gap-1.5">
          <span className="text-muted-foreground font-normal">Guesses Left</span>
          <span className="font-bold">{guessesRemaining}</span>
        </Badge>
        <Badge variant="secondary" className="text-[13px] px-3 py-1 gap-1.5">
          <span className="text-muted-foreground font-normal">Score</span>
          <span className="font-bold">{score}/9</span>
        </Badge>
        {isComplete && (
          <Badge
            className={`text-[13px] px-3 py-1 animate-pop-in ${
              score === 9
                ? "bg-success/15 text-success border-success/40"
                : "bg-primary/10 text-primary border-primary/40"
            }`}
          >
            {score === 9 ? "Perfect!" : "Done"}
          </Badge>
        )}
      </div>

      {!isComplete && (
        <Button variant="ghost" size="sm" onClick={() => setShowGiveUp(true)} className="text-xs text-muted-foreground mt-1">
          Give up
        </Button>
      )}

      <Dialog open={showGiveUp} onOpenChange={(open) => { if (!open) setShowGiveUp(false); }}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">Give up?</DialogTitle>
            <DialogDescription>
              This will end the game and reveal all answers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowGiveUp(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setShowGiveUp(false); onGiveUp(); }}>Give up</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings cog — fixed bottom-right on mobile */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden flex items-center gap-2">
        <a
          href="https://github.com/elementnl/TennisGrid"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Button variant="outline" size="icon" className="rounded-full shadow-md bg-card" asChild>
            <span><img src="/github.svg" alt="" className="w-4 h-4 opacity-60 dark:invert" /></span>
          </Button>
        </a>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          className="rounded-full shadow-md bg-card"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Button>
      </div>
    </header>
  );
}
