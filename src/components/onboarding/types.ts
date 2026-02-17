export interface OnboardingData {
  profile: {
    sex: "male" | "female" | "";
    raceCategory: "open" | "pro" | "";
    level: "beginner" | "intermediate" | "competitor" | "";
    hasRaceExperience: boolean | null;
  };
  event: {
    raceDate: string; // YYYY-MM-DD
    startDate: string; // YYYY-MM-DD
    raceName: string;
    goalTime: string; // HH:MM:SS or ""
  };
  training: {
    trainingDays: number;
    sessionDuration: number;
    preferredDays: string[];
  };
  performance: {
    fiveKmTime: string;
    threeKmTime: string;
    tenKmTime: string;
  };
  equipment: {
    skiErg: boolean;
    sled: boolean;
    rower: boolean;
    farmerHandles: boolean;
    sandbag: boolean;
    wallBall: boolean;
  };
  focus: {
    weaknesses: string[];
  };
  recovery: {
    avgSleepHours: number;
    stressLevel: number;
    otherSportsPW: number;
  };
  previousRace: {
    previousRaceTime: string;
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
    } | null;
    previousRaceIssues: string[];
  };
}

export const initialOnboardingData: OnboardingData = {
  profile: {
    sex: "",
    raceCategory: "",
    level: "",
    hasRaceExperience: null,
  },
  event: {
    raceDate: "",
    startDate: "",
    raceName: "HYROX Race",
    goalTime: "",
  },
  training: {
    trainingDays: 3,
    sessionDuration: 60,
    preferredDays: [],
  },
  performance: {
    fiveKmTime: "",
    threeKmTime: "",
    tenKmTime: "",
  },
  equipment: {
    skiErg: false,
    sled: false,
    rower: false,
    farmerHandles: false,
    sandbag: false,
    wallBall: false,
  },
  focus: {
    weaknesses: [],
  },
  recovery: {
    avgSleepHours: 7,
    stressLevel: 5,
    otherSportsPW: 0,
  },
  previousRace: {
    previousRaceTime: "",
    previousRaceSplits: null,
    previousRaceIssues: [],
  },
};

export interface StepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  errors: Record<string, string>;
}

// Time validation regex
export const TIME_REGEX = /^(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)$/;

export function normalizeTime(value: string): string | null {
  if (!value || !value.trim()) return null;
  const match = value.trim().match(TIME_REGEX);
  if (!match) return null;
  const hours = (match[1] || "00").padStart(2, "0");
  const mins = match[2].padStart(2, "0");
  const secs = match[3];
  return `${hours}:${mins}:${secs}`;
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export function buildPayload(data: OnboardingData) {
  const nt = (v: string) => normalizeTime(v);
  const splits = data.previousRace.previousRaceSplits;
  const hasSplits = splits && Object.values(splits).some((v) => v.trim().length > 0);

  return {
    profile: {
      sex: data.profile.sex,
      raceCategory: data.profile.raceCategory,
      level: data.profile.level,
      hasRaceExperience: data.profile.hasRaceExperience ?? false,
    },
    event: {
      raceDate: data.event.raceDate,
      startDate: data.event.startDate,
      raceName: data.event.raceName || "HYROX Race",
      goalTime: nt(data.event.goalTime),
    },
    training: {
      trainingDays: data.training.trainingDays,
      sessionDuration: data.training.sessionDuration,
      preferredDays: data.training.preferredDays,
    },
    performance: {
      fiveKmTime: nt(data.performance.fiveKmTime),
      threeKmTime: nt(data.performance.threeKmTime),
      tenKmTime: nt(data.performance.tenKmTime),
    },
    equipment: { ...data.equipment },
    focus: { weaknesses: data.focus.weaknesses },
    recovery: { ...data.recovery },
    previousRace: {
      previousRaceTime: nt(data.previousRace.previousRaceTime),
      previousRaceSplits: hasSplits
        ? Object.fromEntries(
            Object.entries(splits!).map(([k, v]) => [k, nt(v)])
          )
        : null,
      previousRaceIssues: data.previousRace.previousRaceIssues,
    },
  };
}
