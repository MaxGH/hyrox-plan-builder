import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Flag, CalendarDays, Target, Calendar as CalendarIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import SessionLogCard, { type SessionLog } from "@/components/SessionLogCard";
import { getSessionDate } from "@/lib/sessionDate";

interface PlanData {
  plan?: {
    raceDate?: string;
    raceName?: string;
    goalTime?: string;
    totalWeeks?: number;
    blocks?: {
      blockNumber?: number;
      blockName?: string;
      blockGoal?: string;
      weekStart?: number;
      weekEnd?: number;
      weeks?: {
        weekNumber?: number;
        weekGoal?: string;
        isDeloadWeek?: boolean;
        sessions?: {
          sessionId?: string;
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

const SESSION_TYPE_TITLES: Record<string, string> = {
  combo: "Kombination", run: "Laufeinheit", strength: "Krafttraining", lauf: "Laufeinheit",
  kraft: "Krafttraining", intervall: "Intervall-Training",
  hyrox: "HYROX-Training", recovery: "Recovery", race: "Wettkampf",
};

function getSessionTitle(s: { focus?: string; sessionType?: string }): string {
  if (s.focus) return s.focus;
  if (s.sessionType) return SESSION_TYPE_TITLES[s.sessionType] || s.sessionType;
  return "Training";
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<SessionLog | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

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
        if (data?.id) setPlanId(data.id);
        setOverrides((data as any)?.session_overrides || {});
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

  const weekSessionCount = useMemo(() => {
    return currentWeekData?.sessions?.length || 0;
  }, [currentWeekData]);

  const todaySessionDate = useMemo(() => {
    if (!todaySession || !startDate) return null;
    const startStr = startDate.toISOString().substring(0, 10);
    return getSessionDate(
      { sessionId: todaySession.sessionId, dayOfWeek: todaySession.dayOfWeek },
      currentWeek,
      startStr,
      overrides
    );
  }, [todaySession, startDate, currentWeek, overrides]);

  useEffect(() => {
    if (!user || !planId || !todaySession?.sessionId || !todaySessionDate) return;
    supabase
      .from("session_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan_id", planId)
      .eq("session_id", todaySession.sessionId)
      .eq("scheduled_date", todaySessionDate)
      .maybeSingle()
      .then(({ data }) => {
        setTodayLog(data as unknown as SessionLog | null);
      });
  }, [user, planId, todaySession?.sessionId, todaySessionDate]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Zap className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }

  if (!planData) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopNav />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-8">
        {/* Plan Summary Banner */}
        <Card className="card-shadow border-l-4 border-l-primary overflow-hidden">
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6">
            {/* Zielzeit */}
            <div className="flex flex-col gap-1">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-2xl font-extrabold text-foreground">
                {p?.goalTime || "—"}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Zielzeit
              </p>
            </div>

            {/* Countdown */}
            <div className="flex flex-col gap-1">
              <Flag className="h-4 w-4 text-primary" />
              {daysUntilRace !== null && daysUntilRace > 0 ? (
                <>
                  <p className="text-2xl font-extrabold text-foreground">{daysUntilRace}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">
                    Tage bis {p?.raceName || "Race Day"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-extrabold text-primary">🏁</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Geschafft
                  </p>
                </>
              )}
            </div>

            {/* Aktuelle Phase */}
            <div className="flex flex-col gap-1">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-2xl font-extrabold text-foreground truncate">
                {currentBlock?.blockName || "—"}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate" title={currentBlock?.blockGoal}>
                {currentBlock?.blockGoal
                  ? currentBlock.blockGoal.length > 60
                    ? currentBlock.blockGoal.substring(0, 60) + "…"
                    : currentBlock.blockGoal
                  : "Aktuelle Phase"}
              </p>
            </div>

            {/* Sessions diese Woche */}
            <div className="flex flex-col gap-1">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <p className="text-2xl font-extrabold text-foreground">
                {weekSessionCount}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Einheiten / Woche
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Timeline */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Fortschritt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex h-6 w-full overflow-hidden rounded-full bg-secondary">
                {blocks.map((block, bi) => {
                  const ws = block.weekStart || 1;
                  const we = block.weekEnd || ws;
                  const span = we - ws + 1;
                  const pct = (span / totalWeeks) * 100;
                  const isCompleted = currentWeek > (we || 0);
                  const isCurrent = currentWeek >= (ws || 0) && currentWeek <= (we || 0);
                  return (
                    <div
                      key={bi}
                      className={`relative flex items-center justify-center ${
                        isCompleted ? "bg-primary/30" : isCurrent ? "bg-primary/15" : "bg-secondary"
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      <span className="truncate px-1 text-[10px] font-bold uppercase text-muted-foreground">
                        {block.blockName || `B${bi + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div
                className="absolute top-0 h-6 w-0.5 bg-primary"
                style={{ left: `${Math.min(((currentWeek - 0.5) / totalWeeks) * 100, 100)}%` }}
              />
              <div className="absolute -top-1 right-0">
                <Flag className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>W1</span>
                <span>W{totalWeeks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Session */}
        <Card className="card-shadow border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Heutiges Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySession ? (
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  {getSessionTitle(todaySession)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {todaySession.sessionType && (
                    <Badge className="bg-primary text-primary-foreground text-xs uppercase">
                      {SESSION_TYPE_LABELS[todaySession.sessionType] || todaySession.sessionType}
                    </Badge>
                  )}
                  {(todaySession.durationMin || todaySession.durationMinutes) && (
                    <Badge variant="outline" className="text-xs">
                      {todaySession.durationMin || todaySession.durationMinutes} Min
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(todaySession.exercises || todaySession.mainBlock || []).slice(0, 3).map((ex, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {ex.name || "Übung"}
                    </Badge>
                  ))}
                </div>
                {planId && todaySessionDate && (
                  <div className="mt-4">
                    <SessionLogCard
                      sessionId={todaySession.sessionId || ""}
                      scheduledDate={todaySessionDate}
                      planId={planId}
                      existingLog={todayLog}
                      onLogChange={(log) => setTodayLog(log)}
                    />
                  </div>
                )}
                <Button
                  onClick={() => navigate("/calendar")}
                  className="mt-4 w-full font-semibold uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 rounded-full"
                  size="sm"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Zum Kalender
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xl font-extrabold uppercase text-foreground">RUHETAG</p>
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
