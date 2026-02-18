import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, Flag, CalendarDays, Target, Clock, ChevronRight,
  Check, Circle
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import SessionLogCard, { type SessionLog } from "@/components/SessionLogCard";
import { getSessionDate } from "@/lib/sessionDate";
import { cn } from "@/lib/utils";

interface PlanData {
  plan?: {
    raceDate?: string;
    raceName?: string;
    goalTime?: string;
    totalWeeks?: number;
    athleteName?: string;
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
  athleteName?: string;
  onboarding_data?: { startDate?: string };
}

const DAY_MAP: Record<string, number> = {
  Sonntag: 0, Montag: 1, Dienstag: 2, Mittwoch: 3,
  Donnerstag: 4, Freitag: 5, Samstag: 6,
};

const DOW_SHORT = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

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
  const [logMap, setLogMap] = useState<Record<string, boolean>>({});

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

    // Load session logs for week dots
    supabase
      .from("session_logs")
      .select("session_id, scheduled_date, completed")
      .eq("user_id", user.id)
      .then(({ data: logs }) => {
        const map: Record<string, boolean> = {};
        logs?.forEach((log) => {
          if (log.completed) map[`${log.session_id}_${log.scheduled_date}`] = true;
        });
        setLogMap(map);
      });
  }, [user]);

  const p = planData?.plan;
  const athleteName = p?.athleteName || (planData as any)?.athleteName || "Athlet";

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
    return Math.ceil((race.getTime() - today.getTime()) / 86400000);
  }, [p?.raceDate, today]);

  const weeksUntilRace = useMemo(() => {
    if (daysUntilRace === null) return null;
    return Math.ceil(daysUntilRace / 7);
  }, [daysUntilRace]);

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

  // Week day status for dots
  const weekDayStatuses = useMemo(() => {
    if (!startDate || !currentWeekData) return [];
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
    const day = weekStart.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dow = d.getDay();
      const dayName = Object.entries(DAY_MAP).find(([, v]) => v === dow)?.[0];
      const session = (currentWeekData?.sessions || []).find(s => s.dayOfWeek === dayName);
      const dateStr = d.toISOString().split("T")[0];
      const isToday = dateStr === today.toISOString().split("T")[0];
      const isPast = d < today;
      const hasSession = !!session;
      const isCompleted = session ? !!logMap[`${session.sessionId}_${dateStr}`] : false;
      return { dow, isToday, isPast, hasSession, isCompleted, label: DOW_SHORT[dow] };
    });
  }, [startDate, currentWeek, currentWeekData, today, logMap]);

  // Upcoming sessions (next 3)
  const upcomingSessions = useMemo(() => {
    if (!startDate) return [];
    const upcoming: { session: any; date: Date; weekNumber: number }[] = [];
    const todayStr = today.toISOString().split("T")[0];

    for (const block of blocks) {
      for (const week of block.weeks || []) {
        for (const session of week.sessions || []) {
          const dow = DAY_MAP[session.dayOfWeek || ""] ?? 1;
          const weekStartD = new Date(startDate);
          weekStartD.setDate(weekStartD.getDate() + ((week.weekNumber || 1) - 1) * 7);
          const dayN = weekStartD.getDay();
          const mondayOff = dayN === 0 ? -6 : 1 - dayN;
          weekStartD.setDate(weekStartD.getDate() + mondayOff);
          const diff = dow === 0 ? 6 : dow - 1;
          const sessionDate = new Date(weekStartD);
          sessionDate.setDate(sessionDate.getDate() + diff);
          const dateStr = sessionDate.toISOString().split("T")[0];
          if (dateStr > todayStr) {
            upcoming.push({ session, date: sessionDate, weekNumber: week.weekNumber || 1 });
          }
        }
      }
    }
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcoming.slice(0, 3);
  }, [blocks, startDate, today]);

  // Block progress %
  const blockProgress = useMemo(() => {
    if (!currentBlock) return 0;
    const ws = currentBlock.weekStart || 1;
    const we = currentBlock.weekEnd || ws;
    const span = we - ws + 1;
    return Math.round(((currentWeek - ws) / span) * 100);
  }, [currentBlock, currentWeek]);

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

  const formatDateShort = (d: Date) => {
    return `${d.getDate()}.${d.getMonth() + 1}.`;
  };

  const getDayName = (d: Date) => {
    const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    return days[d.getDay()];
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <TopNav />

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-8">
        {/* Greeting Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Hi <span className="text-primary">{athleteName}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {todaySession ? "Bereit für dein Training?" : "Heute ist Ruhetag 💪"}
            </p>
          </div>
          <button
            onClick={() => navigate("/plan")}
            className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
          >
            {athleteName.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* Today's Training - Hero Card (Glassy) */}
        <div className="glass rounded-2xl p-5 space-y-4">
          {todaySession ? (
            <>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Training heute
                  </p>
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">
                    {getSessionTitle(todaySession)}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {currentBlock?.blockName && (
                      <span className="text-xs text-muted-foreground">
                        {currentBlock.blockName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    {(todaySession.durationMin || todaySession.durationMinutes) && (
                      <span className="text-xs text-muted-foreground">
                        {todaySession.durationMin || todaySession.durationMinutes} Min
                      </span>
                    )}
                    {todaySession.sessionType && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {SESSION_TYPE_LABELS[todaySession.sessionType] || todaySession.sessionType}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="flex flex-col items-center gap-1 ml-4">
                  <div className="relative h-14 w-14">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle
                        cx="28" cy="28" r="24" fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(blockProgress / 100) * 150.8} 150.8`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      {blockProgress}%
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Block</span>
                </div>
              </div>

              {/* Exercise preview tags */}
              {(todaySession.exercises || todaySession.mainBlock || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(todaySession.exercises || todaySession.mainBlock || []).slice(0, 4).map((ex, i) => (
                    <Badge key={i} className="bg-secondary/80 text-secondary-foreground text-xs font-normal border-0">
                      {ex.name || "Übung"}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3">
                {planId && todaySessionDate && (
                  <div className="flex-1">
                    <SessionLogCard
                      sessionId={todaySession.sessionId || ""}
                      scheduledDate={todaySessionDate}
                      planId={planId}
                      existingLog={todayLog}
                      onLogChange={(log) => setTodayLog(log)}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() => navigate("/calendar")}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground text-sm"
                size="sm"
              >
                Details anzeigen
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-2xl font-extrabold uppercase text-foreground">RUHETAG</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Erholung ist Training. Nutze den Tag zur Regeneration.
              </p>
            </div>
          )}
        </div>

        {/* Week Status Dots */}
        {weekDayStatuses.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Diese Woche
            </p>
            <div className="flex items-center justify-between gap-1">
              {weekDayStatuses.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                      day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      day.isCompleted
                        ? "bg-primary/20"
                        : day.hasSession
                        ? "bg-secondary"
                        : "bg-muted/30"
                    )}
                  >
                    {day.isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : day.hasSession ? (
                      <Circle className="h-3 w-3 text-primary fill-primary/40" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold",
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal / Race Card */}
        {p?.raceName && (
          <div className="glass-accent rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Dein aktueller Trainingsplan
                </p>
                <h3 className="text-lg font-extrabold text-foreground uppercase">
                  {p.raceName}
                </h3>
                {/* Progress dashes */}
                <div className="flex gap-1 mt-2">
                  {blocks.map((block, bi) => {
                    const ws = block.weekStart || 1;
                    const we = block.weekEnd || ws;
                    const isCompleted = currentWeek > we;
                    const isCurrent = currentWeek >= ws && currentWeek <= we;
                    return (
                      <div
                        key={bi}
                        className={cn(
                          "h-1 rounded-full flex-1",
                          isCompleted
                            ? "bg-primary"
                            : isCurrent
                            ? "bg-primary/50"
                            : "bg-muted"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center ml-4">
                <Flag className="h-5 w-5 text-primary mb-1" />
                {weeksUntilRace !== null && weeksUntilRace > 0 && (
                  <Badge className="bg-primary/20 text-primary border-0 text-xs font-bold">
                    {weeksUntilRace}W
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate("/plan")}
              variant="ghost"
              className="mt-3 text-sm text-muted-foreground hover:text-foreground w-full"
              size="sm"
            >
              Mehr zu deinem Trainingsplan
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <Target className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{p?.goalTime || "—"}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Zielzeit</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground truncate">
              W{currentWeek}/{totalWeeks}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Woche</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">
              {currentWeekData?.sessions?.length || 0}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Einheiten</p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nächste Einheiten
              </p>
              <button
                onClick={() => navigate("/calendar")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Alle <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {upcomingSessions.map(({ session, date }, i) => (
              <button
                key={i}
                onClick={() => navigate("/calendar")}
                className="glass w-full rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {getSessionTitle(session)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getDayName(date)} · {formatDateShort(date)}
                    {(session.durationMin || session.durationMinutes) && (
                      <> · {session.durationMin || session.durationMinutes} Min</>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
