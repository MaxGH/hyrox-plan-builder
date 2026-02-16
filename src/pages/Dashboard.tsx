import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Flag, CalendarDays } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface PlanData {
  plan?: {
    raceDate?: string;
    raceName?: string;
    totalWeeks?: number;
    blocks?: {
      blockNumber?: number;
      blockName?: string;
      weekStart?: number;
      weekEnd?: number;
      weeks?: {
        weekNumber?: number;
        weekGoal?: string;
        isDeloadWeek?: boolean;
        sessions?: {
          dayOfWeek?: string;
          sessionType?: string;
          focus?: string;
          durationMin?: number;
          durationMinutes?: number;
          exercises?: { name?: string; sets?: number; reps?: string | number; zone?: string; notes?: string }[];
          mainBlock?: { name?: string }[];
        }[];
      }[];
    }[];
  };
  onboarding_data?: { startDate?: string };
}

const DAY_MAP: Record<string, number> = {
  Sonntag: 0, Montag: 1, Dienstag: 2, Mittwoch: 3,
  Donnerstag: 4, Freitag: 5, Samstag: 6,
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  combo: "Kombi", run: "Lauf", strength: "Kraft",
  hyrox: "HYROX", recovery: "Recovery", race: "Wettkampf",
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.plan_data) setPlanData(data.plan_data as unknown as PlanData);
        if (data?.onboarding_data) setOnboardingData(data.onboarding_data);
        setLoading(false);
      });
  }, [user]);

  const p = planData?.plan;
  const startDate = useMemo(() => {
    const raw = onboardingData?.startDate || (planData as any)?.onboarding_data?.startDate;
    return raw ? new Date(raw) : null;
  }, [onboardingData, planData]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const daysUntilRace = useMemo(() => {
    if (!p?.raceDate) return null;
    const race = new Date(p.raceDate);
    return Math.ceil((race.getTime() - today.getTime()) / (86400000));
  }, [p?.raceDate, today]);

  const currentWeek = useMemo(() => {
    if (!startDate) return 1;
    const diff = today.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(diff / (7 * 86400000)));
  }, [startDate, today]);

  const totalWeeks = p?.totalWeeks || 1;
  const blocks = p?.blocks || [];

  const currentBlock = useMemo(() => {
    return blocks.find(b => currentWeek >= (b.weekStart || 0) && currentWeek <= (b.weekEnd || 0)) || blocks[0];
  }, [blocks, currentWeek]);

  const currentWeekData = useMemo(() => {
    return currentBlock?.weeks?.find(w => w.weekNumber === currentWeek);
  }, [currentBlock, currentWeek]);

  const todaySession = useMemo(() => {
    const todayDow = today.getDay();
    const sessions = currentWeekData?.sessions || [];
    return sessions.find(s => DAY_MAP[s.dayOfWeek || ""] === todayDow) || null;
  }, [currentWeekData, today]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Zap className="h-16 w-16 animate-pulse text-primary drop-shadow-[0_0_24px_hsl(var(--primary)/0.6)]" />
      </div>
    );
  }

  if (!planData) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 pt-6 pb-2 sm:px-8">
        <p className="text-sm font-black uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary text-glow"> COACH</span>
        </p>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pb-8 sm:px-8">
        {/* Countdown */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="flex flex-col items-center py-8">
            {daysUntilRace !== null && daysUntilRace > 0 ? (
              <>
                <p className="text-6xl font-black text-primary text-glow">{daysUntilRace}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Tage bis
                </p>
                <p className="text-lg font-black uppercase tracking-wider text-foreground">
                  {p?.raceName || "Race Day"}
                </p>
              </>
            ) : (
              <p className="text-3xl font-black uppercase text-primary text-glow">GESCHAFFT 🏁</p>
            )}
          </CardContent>
        </Card>

        {/* Current Week */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Aktuelle Trainingswoche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground">
              WOCHE {Math.min(currentWeek, totalWeeks)} VON {totalWeeks}
            </p>
            {currentBlock?.blockName && (
              <Badge className="mt-2 bg-primary/20 text-primary">{currentBlock.blockName}</Badge>
            )}
            {currentWeekData?.weekGoal && (
              <p className="mt-2 text-sm text-muted-foreground">{currentWeekData.weekGoal}</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Timeline */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Fortschritt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Block segments */}
              <div className="flex h-6 w-full overflow-hidden rounded-full">
                {blocks.map((block, bi) => {
                  const ws = block.weekStart || 1;
                  const we = block.weekEnd || ws;
                  const span = we - ws + 1;
                  const pct = (span / totalWeeks) * 100;
                  const shades = [
                    "bg-secondary", "bg-muted", "bg-primary/20", "bg-primary/30", "bg-primary/40",
                  ];
                  return (
                    <div
                      key={bi}
                      className={`relative flex items-center justify-center ${shades[bi % shades.length]}`}
                      style={{ width: `${pct}%` }}
                    >
                      <span className="truncate px-1 text-[10px] font-bold uppercase text-muted-foreground">
                        {block.blockName || `B${bi + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Current week marker */}
              <div
                className="absolute top-0 h-6 w-0.5 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]"
                style={{ left: `${Math.min(((currentWeek - 0.5) / totalWeeks) * 100, 100)}%` }}
              />
              {/* Race flag */}
              <div className="absolute -top-1 right-0">
                <Flag className="h-4 w-4 text-primary" />
              </div>
              {/* Labels */}
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>W1</span>
                <span>W{totalWeeks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Session */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Heutiges Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySession ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {todaySession.sessionType && (
                    <Badge className="bg-primary text-primary-foreground text-xs uppercase">
                      {SESSION_TYPE_LABELS[todaySession.sessionType] || todaySession.sessionType}
                    </Badge>
                  )}
                  {(todaySession.durationMin || todaySession.durationMinutes) && (
                    <span className="text-xs text-muted-foreground">
                      {todaySession.durationMin || todaySession.durationMinutes} Min
                    </span>
                  )}
                </div>
                {todaySession.focus && (
                  <p className="mt-2 text-sm text-foreground">{todaySession.focus}</p>
                )}
                {/* First 3 exercises */}
                <ul className="mt-3 space-y-1">
                  {(todaySession.exercises || todaySession.mainBlock || []).slice(0, 3).map((ex, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {ex.name || "Übung"}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/calendar")}
                  className="mt-4 w-full uppercase tracking-wider"
                  size="sm"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Zum Kalender
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xl font-black uppercase text-foreground">RUHETAG</p>
                <p className="mt-1 text-sm text-muted-foreground">Erholung ist Training.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
