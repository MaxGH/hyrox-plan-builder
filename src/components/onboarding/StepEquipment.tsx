import { StepProps } from "./types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ChipSelect from "./ChipSelect";

const EQUIPMENT_ITEMS: { key: keyof StepProps["data"]["equipment"]; label: string }[] = [
  { key: "skiErg", label: "SkiErg" },
  { key: "sled", label: "Schlitten (Push/Pull)" },
  { key: "rower", label: "Rudergerät" },
  { key: "farmerHandles", label: "Farmer's Carry Griffe" },
  { key: "sandbag", label: "Sandbag" },
  { key: "wallBall", label: "Wall Ball" },
];

const WEAKNESS_OPTIONS = [
  "Laufen",
  "SkiErg",
  "Sled Push",
  "Sled Pull",
  "Burpee Broad Jumps",
  "Rowing",
  "Farmers Carry",
  "Sandbag Lunges",
  "Wall Balls",
];

const WEAKNESS_VALUES = [
  "running",
  "skiErg",
  "sledPush",
  "sledPull",
  "burpeeBroadJumps",
  "rowing",
  "farmersCarry",
  "sandbagLunges",
  "wallBalls",
];

export default function StepEquipment({ data, updateData, errors }: StepProps) {
  const { equipment, focus } = data;

  const toggleEquip = (key: keyof typeof equipment) => {
    updateData({ equipment: { ...equipment, [key]: !equipment[key] } });
  };

  // Map display labels <-> values
  const selectedLabels = focus.weaknesses.map(
    (v) => WEAKNESS_OPTIONS[WEAKNESS_VALUES.indexOf(v)] || v
  );

  const handleWeaknessChange = (labels: string[]) => {
    const values = labels.map(
      (l) => WEAKNESS_VALUES[WEAKNESS_OPTIONS.indexOf(l)] || l
    );
    updateData({ focus: { weaknesses: values } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Equipment & Schwächen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Welche Geräte hast du verfügbar?
        </p>
      </div>

      {/* Equipment */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Ausrüstung verfügbar *
        </Label>
        <div className="space-y-2">
          {EQUIPMENT_ITEMS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3"
            >
              <span className="text-sm text-foreground">{label}</span>
              <Switch
                checked={equipment[key]}
                onCheckedChange={() => toggleEquip(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Schwächen (optional)
        </Label>
        <p className="text-xs text-muted-foreground">
          Wähle die Stationen, an denen du dich verbessern möchtest.
        </p>
        <ChipSelect
          options={WEAKNESS_OPTIONS}
          selected={selectedLabels}
          onChange={handleWeaknessChange}
        />
      </div>
    </div>
  );
}
