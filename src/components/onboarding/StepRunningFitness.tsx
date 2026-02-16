import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChipSelect from "./ChipSelect";
import type { StepProps } from "./types";

const STATION_OPTIONS = [
  "SkiErg", "Rowing", "Running", "Sled Push", "Sled Pull",
  "Burpee Broad Jumps", "Farmers Carry", "Sandbag Lunges", "Wallballs",
];

export default function StepRunningFitness({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fiveKmTime">5K Time (mm:ss)</Label>
        <Input
          id="fiveKmTime"
          placeholder="25:00"
          value={data.fiveKmTime}
          onChange={(e) => updateData({ fiveKmTime: e.target.value })}
        />
        {errors.fiveKmTime && <p className="text-sm text-destructive">{errors.fiveKmTime}</p>}
      </div>

      <div className="space-y-2">
        <Label>Run Frequency</Label>
        <Select value={data.runFrequency} onValueChange={(v) => updateData({ runFrequency: v })}>
          <SelectTrigger>
            <SelectValue placeholder="How often do you run?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1x/week">1x/week</SelectItem>
            <SelectItem value="2x/week">2x/week</SelectItem>
            <SelectItem value="3x+/week">3x+/week</SelectItem>
          </SelectContent>
        </Select>
        {errors.runFrequency && <p className="text-sm text-destructive">{errors.runFrequency}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="longestRecentRun">Longest Recent Run (km)</Label>
        <Input
          id="longestRecentRun"
          type="number"
          placeholder="10"
          value={data.longestRecentRun}
          onChange={(e) =>
            updateData({ longestRecentRun: e.target.value ? Number(e.target.value) : "" })
          }
        />
        {errors.longestRecentRun && (
          <p className="text-sm text-destructive">{errors.longestRecentRun}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Strengths (select at least 1)</Label>
        <ChipSelect
          options={STATION_OPTIONS}
          selected={data.strengths}
          disabled={data.weaknesses}
          onChange={(v) => updateData({ strengths: v })}
        />
        {errors.strengths && <p className="text-sm text-destructive">{errors.strengths}</p>}
      </div>

      <div className="space-y-2">
        <Label>Weaknesses (select at least 1)</Label>
        <ChipSelect
          options={STATION_OPTIONS}
          selected={data.weaknesses}
          disabled={data.strengths}
          onChange={(v) => updateData({ weaknesses: v })}
        />
        {errors.weaknesses && <p className="text-sm text-destructive">{errors.weaknesses}</p>}
      </div>
    </div>
  );
}
