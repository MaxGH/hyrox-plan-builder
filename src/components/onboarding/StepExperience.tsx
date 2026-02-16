import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

export default function StepExperience({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Level</Label>
        <Select value={data.level} onValueChange={(v) => updateData({ level: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
            <SelectItem value="Elite">Elite</SelectItem>
          </SelectContent>
        </Select>
        {errors.level && <p className="text-sm text-destructive">{errors.level}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="experienceYears">Years of Experience (0–20)</Label>
        <Input
          id="experienceYears"
          type="number"
          min={0}
          max={20}
          placeholder="2"
          value={data.experienceYears}
          onChange={(e) =>
            updateData({ experienceYears: e.target.value ? Number(e.target.value) : "" })
          }
        />
        {errors.experienceYears && (
          <p className="text-sm text-destructive">{errors.experienceYears}</p>
        )}
      </div>
    </div>
  );
}
