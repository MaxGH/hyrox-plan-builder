import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StepProps } from "./types";

export default function StepPersonalInfo({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your name"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          placeholder="80"
          value={data.weight}
          onChange={(e) => updateData({ weight: e.target.value ? Number(e.target.value) : "" })}
        />
        {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          placeholder="180"
          value={data.height}
          onChange={(e) => updateData({ height: e.target.value ? Number(e.target.value) : "" })}
        />
        {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
      </div>
    </div>
  );
}
