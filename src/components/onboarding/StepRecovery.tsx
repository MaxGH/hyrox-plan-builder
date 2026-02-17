import { StepProps, TIME_REGEX } from "./types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import ChipSelect from "./ChipSelect";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ISSUE_OPTIONS = ["Laufen", "Zu schneller Start", "Leere letzte 3 km", "Übergänge"];
const ISSUE_VALUES = ["running", "tooFastStart", "emptyLast3k", "transitions"];

const SPLIT_FIELDS = [
  { key: "totalRun", label: "Gesamt-Laufzeit" },
  { key: "skiErg", label: "SkiErg" },
  { key: "sledPush", label: "Sled Push" },
  { key: "sledPull", label: "Sled Pull" },
  { key: "burpeeBroadJumps", label: "Burpee Broad Jumps" },
  { key: "rowing", label: "Rowing" },
  { key: "farmersCarry", label: "Farmers Carry" },
  { key: "sandbagLunges", label: "Sandbag Lunges" },
  { key: "wallBalls", label: "Wall Balls" },
] as const;

export default function StepRecovery({ data, updateData, errors }: StepProps) {
  const { recovery, previousRace, profile } = data;
  const [splitsOpen, setSplitsOpen] = useState(false);

  const splits = previousRace.previousRaceSplits || {
    totalRun: "", skiErg: "", sledPush: "", sledPull: "",
    burpeeBroadJumps: "", rowing: "", farmersCarry: "", sandbagLunges: "", wallBalls: "",
  };

  const updateSplit = (key: string, value: string) => {
    updateData({
      previousRace: {
        ...previousRace,
        previousRaceSplits: { ...splits, [key]: value },
      },
    });
  };

  const issueLabels = previousRace.previousRaceIssues.map(
    (v) => ISSUE_OPTIONS[ISSUE_VALUES.indexOf(v)] || v
  );

  const handleIssueChange = (labels: string[]) => {
    const values = labels.map(
      (l) => ISSUE_VALUES[ISSUE_OPTIONS.indexOf(l)] || l
    );
    updateData({ previousRace: { ...previousRace, previousRaceIssues: values } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Recovery & Rennerfahrung</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dein Lebensstil & bisherige Erfahrung.</p>
      </div>

      {/* Sleep */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Durchschnittliche Schlafstunden
        </Label>
        <div className="flex items-center gap-4">
          <Slider
            min={3} max={10} step={0.5}
            value={[recovery.avgSleepHours]}
            onValueChange={([v]) => updateData({ recovery: { ...recovery, avgSleepHours: v } })}
            className="flex-1"
          />
          <span className="w-10 text-center text-lg font-bold text-foreground">
            {recovery.avgSleepHours}
          </span>
        </div>
      </div>

      {/* Stress */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Stresslevel (1–10)
        </Label>
        <div className="flex items-center gap-4">
          <Slider
            min={1} max={10} step={1}
            value={[recovery.stressLevel]}
            onValueChange={([v]) => updateData({ recovery: { ...recovery, stressLevel: v } })}
            className="flex-1"
          />
          <span className="w-8 text-center text-lg font-bold text-foreground">
            {recovery.stressLevel}
          </span>
        </div>
      </div>

      {/* Other sports */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Andere Sporteinheiten / Woche
        </Label>
        <div className="flex items-center gap-4">
          <Slider
            min={0} max={7} step={1}
            value={[recovery.otherSportsPW]}
            onValueChange={([v]) => updateData({ recovery: { ...recovery, otherSportsPW: v } })}
            className="flex-1"
          />
          <span className="w-8 text-center text-lg font-bold text-foreground">
            {recovery.otherSportsPW}
          </span>
        </div>
      </div>

      {/* Previous race - only if hasRaceExperience */}
      {profile.hasRaceExperience && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-lg font-bold text-foreground">Letztes Rennen</h3>

          {/* Previous Race Time */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Gesamtzeit (optional)
            </Label>
            <Input
              value={previousRace.previousRaceTime}
              onChange={(e) =>
                updateData({ previousRace: { ...previousRace, previousRaceTime: e.target.value } })
              }
              placeholder="HH:MM:SS, z. B. 01:15:00"
              className="border-border bg-secondary rounded-xl"
            />
            {errors["previousRace.previousRaceTime"] && (
              <p className="text-xs text-destructive">{errors["previousRace.previousRaceTime"]}</p>
            )}
          </div>

          {/* Splits (collapsible) */}
          <button
            type="button"
            onClick={() => setSplitsOpen(!splitsOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground"
          >
            Splits (optional)
            {splitsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {splitsOpen && (
            <div className="space-y-3 pl-2">
              {SPLIT_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    value={(splits as any)[key] || ""}
                    onChange={(e) => updateSplit(key, e.target.value)}
                    placeholder="MM:SS oder HH:MM:SS"
                    className="border-border bg-secondary rounded-xl"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Issues */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Probleme im Rennen (optional)
            </Label>
            <ChipSelect
              options={ISSUE_OPTIONS}
              selected={issueLabels}
              onChange={handleIssueChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
