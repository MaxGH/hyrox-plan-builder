import { StepProps, TIME_REGEX } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StepPerformance({ data, updateData, errors }: StepProps) {
  const { performance } = data;

  const update = (field: string, value: string) => {
    updateData({ performance: { ...performance, [field]: value } });
  };

  const fields = [
    { key: "fiveKmTime", label: "5 km Laufzeit", placeholder: "MM:SS oder HH:MM:SS" },
    { key: "threeKmTime", label: "3 km Laufzeit", placeholder: "MM:SS oder HH:MM:SS" },
    { key: "tenKmTime", label: "10 km Laufzeit", placeholder: "MM:SS oder HH:MM:SS" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Leistungsbasis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bitte mindestens eine Laufzeit angeben (z.B. 5k).
        </p>
      </div>

      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </Label>
          <Input
            value={performance[key]}
            onChange={(e) => update(key, e.target.value)}
            placeholder={placeholder}
            className="border-border bg-secondary rounded-xl"
          />
          {errors[`performance.${key}`] && (
            <p className="text-xs text-destructive">{errors[`performance.${key}`]}</p>
          )}
          <p className="text-xs text-muted-foreground">Format MM:SS oder HH:MM:SS, z. B. 25:30</p>
        </div>
      ))}

      {errors["performance.atLeastOne"] && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors["performance.atLeastOne"]}
        </p>
      )}
    </div>
  );
}
