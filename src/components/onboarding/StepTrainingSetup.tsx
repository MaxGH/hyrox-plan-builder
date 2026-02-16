import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ChipSelect from "./ChipSelect";
import type { StepProps } from "./types";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const ENVIRONMENTS = ["Gym", "Home", "Outdoor"];
const EQUIPMENT = ["SkiErg", "Sled", "Rower", "Dumbbells", "Sandbag", "Wallball", "None"];

export default function StepTrainingSetup({ data, updateData, errors }: StepProps) {
  const durationIndex = DURATION_OPTIONS.indexOf(data.sessionDuration);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Training Days per Week: {data.trainingDays}</Label>
        <Slider
          value={[data.trainingDays]}
          onValueChange={([v]) => updateData({ trainingDays: v })}
          min={1}
          max={7}
          step={1}
        />
      </div>

      <div className="space-y-3">
        <Label>Session Duration: {data.sessionDuration} min</Label>
        <Slider
          value={[durationIndex >= 0 ? durationIndex : 2]}
          onValueChange={([v]) => updateData({ sessionDuration: DURATION_OPTIONS[v] })}
          min={0}
          max={4}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {DURATION_OPTIONS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Training Environment</Label>
        <ChipSelect
          options={ENVIRONMENTS}
          selected={data.trainingEnvironment}
          onChange={(v) => updateData({ trainingEnvironment: v })}
        />
        {errors.trainingEnvironment && (
          <p className="text-sm text-destructive">{errors.trainingEnvironment}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Available Equipment</Label>
        <ChipSelect
          options={EQUIPMENT}
          selected={data.availableEquipment}
          onChange={(v) => updateData({ availableEquipment: v })}
        />
        {errors.availableEquipment && (
          <p className="text-sm text-destructive">{errors.availableEquipment}</p>
        )}
      </div>
    </div>
  );
}
