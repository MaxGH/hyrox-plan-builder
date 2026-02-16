import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StepProps } from "./types";
import type { OnboardingData } from "./types";

const SPLIT_FIELDS: { key: keyof OnboardingData["previousRaceSplits"]; label: string }[] = [
  { key: "totalRun", label: "Total Run" },
  { key: "skiErg", label: "SkiErg" },
  { key: "sledPush", label: "Sled Push" },
  { key: "sledPull", label: "Sled Pull" },
  { key: "burpeeBroadJumps", label: "Burpee Broad Jumps" },
  { key: "rowing", label: "Rowing" },
  { key: "farmersCarry", label: "Farmer's Carry" },
  { key: "sandbagLunges", label: "Sandbag Lunges" },
  { key: "wallBalls", label: "Wall Balls" },
];

export default function StepRaceHistory({ data, updateData, errors }: StepProps) {
  const updateSplit = (key: string, value: string) => {
    updateData({
      previousRaceSplits: { ...data.previousRaceSplits, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Have you raced HYROX before?</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, label: "Yes, I've raced" },
            { value: false, label: "No, first time" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => updateData({ hasRaceExperience: opt.value })}
              className={cn(
                "rounded-lg border-2 px-4 py-4 text-sm font-semibold uppercase tracking-wider transition-all",
                data.hasRaceExperience === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.hasRaceExperience && (
          <p className="text-sm text-destructive">{errors.hasRaceExperience}</p>
        )}
      </div>

      {data.hasRaceExperience === true && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="previousRaceTime">Previous Race Time (hh:mm:ss)</Label>
            <Input
              id="previousRaceTime"
              placeholder="01:20:00"
              value={data.previousRaceTime}
              onChange={(e) => updateData({ previousRaceTime: e.target.value })}
            />
            {errors.previousRaceTime && (
              <p className="text-sm text-destructive">{errors.previousRaceTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="previousRaceWeaknesses">What felt hardest? (optional)</Label>
            <Textarea
              id="previousRaceWeaknesses"
              placeholder="e.g. Sled Push was brutal, legs gave out on lunges"
              value={data.previousRaceWeaknesses}
              onChange={(e) => updateData({ previousRaceWeaknesses: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Split Times (mm:ss, all optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              {SPLIT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <Input
                    placeholder="mm:ss"
                    value={data.previousRaceSplits[f.key]}
                    onChange={(e) => updateSplit(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.hasRaceExperience === false && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center animate-in fade-in-0 duration-300">
          <p className="text-lg font-semibold text-primary">
            Great — we'll build your baseline plan from scratch!
          </p>
        </div>
      )}
    </div>
  );
}
