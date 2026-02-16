import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = [
  "Personal Info",
  "Experience",
  "Training Setup",
  "Running Fitness",
  "Lifestyle",
  "Race Goal",
  "Race History",
];

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold uppercase tracking-wider text-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{STEP_LABELS[currentStep]}</span>
      </div>
      <Progress value={percent} className="h-2 bg-secondary" />
    </div>
  );
}
