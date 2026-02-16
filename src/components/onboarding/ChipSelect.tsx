import { cn } from "@/lib/utils";

interface ChipSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function ChipSelect({ options, selected, onChange }: ChipSelectProps) {
  const toggle = (option: string) => {
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
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
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
