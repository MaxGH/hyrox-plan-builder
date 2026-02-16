import { cn } from "@/lib/utils";

interface ChipSelectProps {
  options: string[];
  selected: string[];
  disabled?: string[];
  onChange: (selected: string[]) => void;
}

export default function ChipSelect({ options, selected, disabled = [], onChange }: ChipSelectProps) {
  const toggle = (option: string) => {
    if (disabled.includes(option)) return;
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const isDisabled = disabled.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            disabled={isDisabled}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : isDisabled
                  ? "border-border/50 bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                  : "border-border bg-background text-foreground hover:border-primary/50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
