import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { StepProps } from "./types";

export default function StepLifestyle({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Average Sleep: {data.avgSleepHours} hours</Label>
        <Slider
          value={[data.avgSleepHours]}
          onValueChange={([v]) => updateData({ avgSleepHours: v })}
          min={4}
          max={10}
          step={0.5}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>4h</span>
          <span>10h</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Stress Level: {data.stressLevel}/10</Label>
        <Slider
          value={[data.stressLevel]}
          onValueChange={([v]) => updateData({ stressLevel: v })}
          min={1}
          max={10}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
