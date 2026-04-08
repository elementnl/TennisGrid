import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CategoryValue from "@/components/CategoryValue";

export default function AnswersDialog({ validPlayers, rowCategory, colCategory, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Valid Answers</DialogTitle>
          <DialogDescription>
            Players matching both categories
          </DialogDescription>
        </DialogHeader>

        {/* Category reminder */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{rowCategory.label}:</span>
            <CategoryValue category={rowCategory} className="text-sm font-semibold text-primary uppercase" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{colCategory.label}:</span>
            <CategoryValue category={colCategory} className="text-sm font-semibold text-primary uppercase" />
          </div>
        </div>

        {/* Player list */}
        <ul className="flex flex-col gap-2">
          {validPlayers.slice(0, 8).map((player) => (
            <li
              key={player.name}
              className="flex items-baseline justify-between px-3 py-2 bg-muted rounded-lg"
            >
              <span className="font-semibold text-sm text-foreground">
                {player.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {player.country} · {player.tour.toUpperCase()}
              </span>
            </li>
          ))}
        </ul>

        {validPlayers.length > 8 && (
          <p className="text-xs text-muted-foreground text-center">
            +{validPlayers.length - 8} more
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
