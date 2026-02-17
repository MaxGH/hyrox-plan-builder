import { StepProps } from "./types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import ChipSelect from "./ChipSelect";

const DURATION_OPTIONS = [45, 60, 90, 120];
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function StepTraining({ data, updateData, errors }: StepProps) {
  const { training } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Training</h2>
        <p className="mt-1 text-sm text-muted-foreground">Wie sieht dein Training aus?</p>
      </div>

      {/* Training Days */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trainingstage / Woche *
        </Label>
        <div className="flex items-center gap-4">
          <Slider
            min={3}
            max={6}
            step={1}
            value={[training.trainingDays]}
            onValueChange={([v]) =>
              updateData({ training: { ...training, trainingDays: v } })
            }
            className="flex-1"
          />
          <span className="w-8 text-center text-lg font-bold text-foreground">
            {training.trainingDays}
          </span>
        </div>
      </div>

      {/* Session Duration */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Session-Dauer (Minuten) *
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => updateData({ training: { ...training, sessionDuration: d } })}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-semibold transition-all",
                training.sessionDuration === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-foreground hover:border-primary/50"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        {errors["training.sessionDuration"] && (
          <p className="text-xs text-destructive">{errors["training.sessionDuration"]}</p>
        )}
      </div>

      {/* Preferred Days */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Bevorzugte Tage (optional)
        </Label>
        <ChipSelect
          options={DAYS}
          selected={training.preferredDays}
          onChange={(v) => updateData({ training: { ...training, preferredDays: v } })}
        />
      </div>
    </div>
  );
}
