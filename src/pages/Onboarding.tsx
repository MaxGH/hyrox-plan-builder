import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, LogOut, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "@/components/onboarding/ProgressBar";
import StepEvent from "@/components/onboarding/StepEvent";
import StepProfile from "@/components/onboarding/StepProfile";
import StepPerformance from "@/components/onboarding/StepPerformance";
import StepTraining from "@/components/onboarding/StepTraining";
import StepEquipment from "@/components/onboarding/StepEquipment";
import StepRecovery from "@/components/onboarding/StepRecovery";
import {
  type OnboardingData,
  initialOnboardingData,
  buildPayload,
  isValidDate,
  TIME_REGEX,
} from "@/components/onboarding/types";

const TOTAL_STEPS = 6;

type ValidationRule = {
  key: string;
  message: string;
  validate: (d: OnboardingData) => boolean;
};

const STEP_VALIDATIONS: Record<number, ValidationRule[]> = {
  0: [
    { key: "event.raceDate", message: "Renndatum ist erforderlich", validate: (d) => isValidDate(d.event.raceDate) },
    { key: "event.startDate", message: "Startdatum ist erforderlich", validate: (d) => isValidDate(d.event.startDate) },
    {
      key: "event.startDate",
      message: "Startdatum muss vor dem Renndatum liegen",
      validate: (d) => !isValidDate(d.event.startDate) || !isValidDate(d.event.raceDate) || d.event.startDate < d.event.raceDate,
    },
    {
      key: "event.goalTime",
      message: "Ungültiges Zeitformat (HH:MM:SS)",
      validate: (d) => !d.event.goalTime.trim() || TIME_REGEX.test(d.event.goalTime.trim()),
    },
  ],
  1: [
    { key: "profile.sex", message: "Geschlecht auswählen", validate: (d) => d.profile.sex !== "" },
    { key: "profile.raceCategory", message: "Kategorie auswählen", validate: (d) => d.profile.raceCategory !== "" },
    { key: "profile.level", message: "Level auswählen", validate: (d) => d.profile.level !== "" },
    { key: "profile.hasRaceExperience", message: "Bitte auswählen", validate: (d) => d.profile.hasRaceExperience !== null },
  ],
  2: [
    {
      key: "performance.atLeastOne",
      message: "Bitte mindestens eine Laufzeit angeben (z. B. 5k).",
      validate: (d) =>
        d.performance.fiveKmTime.trim().length > 0 ||
        d.performance.threeKmTime.trim().length > 0 ||
        d.performance.tenKmTime.trim().length > 0,
    },
    {
      key: "performance.fiveKmTime",
      message: "Ungültiges Zeitformat",
      validate: (d) => !d.performance.fiveKmTime.trim() || TIME_REGEX.test(d.performance.fiveKmTime.trim()),
    },
    {
      key: "performance.threeKmTime",
      message: "Ungültiges Zeitformat",
      validate: (d) => !d.performance.threeKmTime.trim() || TIME_REGEX.test(d.performance.threeKmTime.trim()),
    },
    {
      key: "performance.tenKmTime",
      message: "Ungültiges Zeitformat",
      validate: (d) => !d.performance.tenKmTime.trim() || TIME_REGEX.test(d.performance.tenKmTime.trim()),
    },
  ],
  3: [], // all have defaults
  4: [], // equipment toggles always valid, weaknesses optional
  5: [
    {
      key: "previousRace.previousRaceTime",
      message: "Ungültiges Zeitformat (HH:MM:SS)",
      validate: (d) =>
        !d.previousRace.previousRaceTime.trim() || TIME_REGEX.test(d.previousRace.previousRaceTime.trim()),
    },
  ],
};

export default function Onboarding() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Warn on leave
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setDirty(true);
    setData((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(updates)) {
        (next as any)[key] = typeof value === "object" && !Array.isArray(value) && value !== null
          ? { ...(prev as any)[key], ...value }
          : value;
      }
      return next;
    });
    // Clear related errors
    const clearedErrors: Record<string, string> = {};
    for (const key of Object.keys(updates)) {
      // clear all errors starting with this key
      for (const eKey of Object.keys(errors)) {
        if (eKey.startsWith(key)) clearedErrors[eKey] = "";
      }
    }
    if (Object.keys(clearedErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...clearedErrors }));
    }
  }, [errors]);

  const validateStep = (): boolean => {
    const rules = STEP_VALIDATIONS[step] || [];
    const newErrors: Record<string, string> = {};
    let valid = true;
    for (const rule of rules) {
      if (!rule.validate(data)) {
        newErrors[rule.key] = rule.message;
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

  const submit = async () => {
    if (!validateStep() || !user) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Nicht eingeloggt");

      const payload = buildPayload(data);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ onboarding: payload }),
        }
      );

      if (response.status === 429) {
        const err = await response.json();
        setSubmitting(false);
        toast({ variant: "destructive", title: "Nicht möglich", description: err.error });
        return;
      }

      if (!response.ok) throw new Error("Plan-Generierung fehlgeschlagen");

      // Set onboarding complete
      await supabase
        .from("profiles" as any)
        .update({ onboarding_complete: true } as any)
        .eq("user_id", user.id);

      setDirty(false);
      navigate("/generating");
    } catch (err: any) {
      setSubmitting(false);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message || "Plan konnte nicht erstellt werden.",
      });
    }
  };

  const stepProps = { data, updateData, errors };

  const STEPS = [
    <StepEvent key={0} {...stepProps} />,
    <StepProfile key={1} {...stepProps} />,
    <StepPerformance key={2} {...stepProps} />,
    <StepTraining key={3} {...stepProps} />,
    <StepEquipment key={4} {...stepProps} />,
    <StepRecovery key={5} {...stepProps} />,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-black uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary text-glow"> COACH</span>
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (dirty && !confirm("Fortschritt geht verloren. Trotzdem abbrechen?")) return;
              navigate("/");
            }}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Pause className="mr-1 h-4 w-4" /> Später
          </Button>
          <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="mr-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        <div className="mt-8 flex-1 animate-in fade-in-0 slide-in-from-right-4 duration-300" key={step}>
          {STEPS[step]}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button onClick={back} variant="outline" className="flex-1 uppercase tracking-wider">
              <ArrowLeft className="mr-1 h-4 w-4" /> Zurück
            </Button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} className="flex-1 uppercase tracking-wider font-bold">
              Weiter <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={submitting}
              className="flex-1 uppercase tracking-wider font-bold text-lg py-6"
            >
              {submitting ? "Wird erstellt…" : "Plan anfordern"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
