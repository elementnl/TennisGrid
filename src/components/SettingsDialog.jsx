import { Sun, Moon, Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { VisuallyHidden } from "react-aria"

export default function SettingsDialog({ open, onClose, theme, setTheme, units, setUnits }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <VisuallyHidden><DialogDescription>
          </DialogDescription></VisuallyHidden>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          {/* Theme */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon size={18} className="text-muted-foreground" />
              ) : (
                <Sun size={18} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">App appearance</p>
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-28">
                {theme === "dark" ? "Dark" : "Light"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-px bg-border" />

          {/* Units */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Ruler size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Units</p>
                <p className="text-xs text-muted-foreground">Height display format</p>
              </div>
            </div>
            <Select value={units} onValueChange={setUnits}>
              <SelectTrigger className="w-28">
                {units === "imperial" ? "Imperial" : "Metric"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial</SelectItem>
                <SelectItem value="metric">Metric</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
