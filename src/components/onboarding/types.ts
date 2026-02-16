export interface OnboardingData {
  // Step 1
  name: string;
  weight: number | "";
  height: number | "";
  // Step 2
  level: string;
  experienceYears: number | "";
  // Step 3
  trainingDays: number;
  sessionDuration: number;
  trainingEnvironment: string[];
  availableEquipment: string[];
  // Step 4
  fiveKmTime: string;
  runFrequency: string;
  longestRecentRun: number | "";
  strengths: string;
  weaknesses: string;
  // Step 5
  avgSleepHours: number;
  stressLevel: number;
  otherSports: string;
  // Step 6
  raceName: string;
  raceDate: Date | undefined;
  startDate: Date | undefined;
  goalTime: string;
  // Step 7
  hasRaceExperience: boolean | null;
  previousRaceTime: string;
  previousRaceWeaknesses: string;
  previousRaceSplits: {
    totalRun: string;
    skiErg: string;
    sledPush: string;
    sledPull: string;
    burpeeBroadJumps: string;
    rowing: string;
    farmersCarry: string;
    sandbagLunges: string;
    wallBalls: string;
  };
}

export const initialOnboardingData: OnboardingData = {
  name: "",
  weight: "",
  height: "",
  level: "",
  experienceYears: "",
  trainingDays: 3,
  sessionDuration: 60,
  trainingEnvironment: [],
  availableEquipment: [],
  fiveKmTime: "",
  runFrequency: "",
  longestRecentRun: "",
  strengths: "",
  weaknesses: "",
  avgSleepHours: 7,
  stressLevel: 5,
  otherSports: "",
  raceName: "",
  raceDate: undefined,
  startDate: undefined,
  goalTime: "",
  hasRaceExperience: null,
  previousRaceTime: "",
  previousRaceWeaknesses: "",
  previousRaceSplits: {
    totalRun: "",
    skiErg: "",
    sledPush: "",
    sledPull: "",
    burpeeBroadJumps: "",
    rowing: "",
    farmersCarry: "",
    sandbagLunges: "",
    wallBalls: "",
  },
};

export interface StepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  errors: Record<string, string>;
}
