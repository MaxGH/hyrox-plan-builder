import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react";
import ProgressBar from "@/components/onboarding/ProgressBar";
import StepPersonalInfo from "@/components/onboarding/StepPersonalInfo";
import StepExperience from "@/components/onboarding/StepExperience";
import StepTrainingSetup from "@/components/onboarding/StepTrainingSetup";
import StepRunningFitness from "@/components/onboarding/StepRunningFitness";
import StepLifestyle from "@/components/onboarding/StepLifestyle";
import StepRaceGoal from "@/components/onboarding/StepRaceGoal";
import StepRaceHistory from "@/components/onboarding/StepRaceHistory";
import { type OnboardingData, initialOnboardingData } from "@/components/onboarding/types";

const TOTAL_STEPS = 7;

type ValidationRule = {
  field: keyof OnboardingData;
  message: string;
  validate: (data: OnboardingData) => boolean;
};

const STEP_VALIDATIONS: Record<number, ValidationRule[]> = {
  0: [
    { field: "name", message: "Name is required", validate: (d) => d.name.trim().length > 0 },
    { field: "weight", message: "Weight is required", validate: (d) => d.weight !== "" && Number(d.weight) > 0 },
    { field: "height", message: "Height is required", validate: (d) => d.height !== "" && Number(d.height) > 0 },
  ],
  1: [
    { field: "level", message: "Select a level", validate: (d) => d.level.length > 0 },
    { field: "experienceYears", message: "Experience is required", validate: (d) => d.experienceYears !== "" },
  ],
  2: [
    { field: "trainingEnvironment", message: "Select at least one environment", validate: (d) => d.trainingEnvironment.length > 0 },
    { field: "availableEquipment", message: "Select at least one option", validate: (d) => d.availableEquipment.length > 0 },
  ],
  3: [
    { field: "fiveKmTime", message: "5K time is required", validate: (d) => d.fiveKmTime.trim().length > 0 },
    { field: "runFrequency", message: "Run frequency is required", validate: (d) => d.runFrequency.length > 0 },
    { field: "longestRecentRun", message: "Longest run is required", validate: (d) => d.longestRecentRun !== "" },
  ],
  4: [], // all optional or have defaults
  5: [
    { field: "raceName", message: "Race name is required", validate: (d) => d.raceName.trim().length > 0 },
    { field: "raceDate", message: "Race date is required", validate: (d) => d.raceDate !== undefined },
    { field: "startDate", message: "Start date is required", validate: (d) => d.startDate !== undefined },
    { field: "goalTime", message: "Goal time is required", validate: (d) => d.goalTime.trim().length > 0 },
  ],
  6: [
    { field: "hasRaceExperience", message: "Please select an option", validate: (d) => d.hasRaceExperience !== null },
    {
      field: "previousRaceTime",
      message: "Previous race time is required",
      validate: (d) => d.hasRaceExperience !== true || d.previousRaceTime.trim().length > 0,
    },
  ],
};

export default function Onboarding() {
  const { signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors: Record<string, string> = {};
    for (const key of Object.keys(updates)) {
      clearedErrors[key] = "";
    }
    setErrors((prev) => ({ ...prev, ...clearedErrors }));
  }, []);

  const validateStep = (): boolean => {
    const rules = STEP_VALIDATIONS[step] || [];
    const newErrors: Record<string, string> = {};
    let valid = true;
    for (const rule of rules) {
      if (!rule.validate(data)) {
        newErrors[rule.field as string] = rule.message;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const submit = () => {
    if (!validateStep()) return;
    console.log("📋 Onboarding Data:", JSON.stringify(data, null, 2));
  };

  const stepProps = { data, updateData, errors };

  const STEPS = [
    <StepPersonalInfo key={0} {...stepProps} />,
    <StepExperience key={1} {...stepProps} />,
    <StepTrainingSetup key={2} {...stepProps} />,
    <StepRunningFitness key={3} {...stepProps} />,
    <StepLifestyle key={4} {...stepProps} />,
    <StepRaceGoal key={5} {...stepProps} />,
    <StepRaceHistory key={6} {...stepProps} />,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-black uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary text-glow"> COACH</span>
        </h1>
        <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground">
          <LogOut className="mr-1 h-4 w-4" /> Log out
        </Button>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        <div className="mt-8 flex-1 animate-in fade-in-0 slide-in-from-right-4 duration-300" key={step}>
          {STEPS[step]}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button onClick={back} variant="outline" className="flex-1 uppercase tracking-wider">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} className="flex-1 uppercase tracking-wider font-bold">
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} className="flex-1 uppercase tracking-wider font-bold text-lg py-6">
              Create My Plan
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
