import { StepProps } from "./types";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

function SegmentedButton({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labels: Record<string, string>;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-foreground hover:border-primary/50"
          )}
        >
          {labels[opt] || opt}
        </button>
      ))}
    </div>
  );
}

export default function StepProfile({ data, updateData, errors }: StepProps) {
  const { profile } = data;

  const update = (field: string, value: any) => {
    updateData({ profile: { ...profile, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dein Profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Erzähl uns etwas über dich.</p>
      </div>

      {/* Sex */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Geschlecht *
        </Label>
        <SegmentedButton
          options={["male", "female"]}
          value={profile.sex}
          onChange={(v) => update("sex", v)}
          labels={{ male: "Männlich", female: "Weiblich" }}
        />
        {errors["profile.sex"] && (
          <p className="text-xs text-destructive">{errors["profile.sex"]}</p>
        )}
      </div>

      {/* Race Category */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Kategorie *
        </Label>
        <SegmentedButton
          options={["open", "pro"]}
          value={profile.raceCategory}
          onChange={(v) => update("raceCategory", v)}
          labels={{ open: "Open", pro: "Pro" }}
        />
        {errors["profile.raceCategory"] && (
          <p className="text-xs text-destructive">{errors["profile.raceCategory"]}</p>
        )}
      </div>

      {/* Level */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Erfahrungslevel *
        </Label>
        <SegmentedButton
          options={["beginner", "intermediate", "competitor"]}
          value={profile.level}
          onChange={(v) => update("level", v)}
          labels={{
            beginner: "Anfänger",
            intermediate: "Fortgeschritten",
            competitor: "Wettkämpfer",
          }}
        />
        {errors["profile.level"] && (
          <p className="text-xs text-destructive">{errors["profile.level"]}</p>
        )}
      </div>

      {/* Race Experience */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          HYROX-Rennerfahrung *
        </Label>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
          <span className="flex-1 text-sm text-foreground">
            Hast du bereits an einem HYROX teilgenommen?
          </span>
          <Switch
            checked={profile.hasRaceExperience === true}
            onCheckedChange={(checked) => update("hasRaceExperience", checked)}
          />
        </div>
        {errors["profile.hasRaceExperience"] && (
          <p className="text-xs text-destructive">{errors["profile.hasRaceExperience"]}</p>
        )}
      </div>
    </div>
  );
}
