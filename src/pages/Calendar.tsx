import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ChevronLeft, ChevronRight, GripVertical, Undo2, Check, RotateCcw, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { toast } from "@/hooks/use-toast";
import SessionLogCard, { type SessionLog } from "@/components/SessionLogCard";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

// --- Types ---

interface Exercise {
  name?: string;
  sets?: number;
  reps?: string | number;
  zone?: string;
  notes?: string;
  distance?: string;
  duration?: string;
  pace?: string;
  weight?: string;
}

interface Session {
  sessionId?: string;
  dayOfWeek?: string;
  sessionType?: string;
  focus?: string;
  durationMin?: number;
  durationMinutes?: number;
  exercises?: Exercise[];
  mainBlock?: Exercise[];
}

interface Week {
  weekNumber?: number;
  weekGoal?: string;
  isDeloadWeek?: boolean;
  coachNote?: string;
  sessions?: Session[];
}

interface Block {
  blockNumber?: number;
  blockName?: string;
  weekStart?: number;
  weekEnd?: number;
  weeks?: Week[];
}

interface PlanShape {
  plan?: {
    raceDate?: string;
    totalWeeks?: number;
    blocks?: Block[];
  };
}

type Overrides = Record<string, string>;

// --- Constants ---

const DOW_SHORT = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const DOW_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DOW_GERMAN: Record<string, number> = {
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

function getSessionTitle(session: Session): string {
  if (session.focus) return session.focus;
  if (session.sessionType) return SESSION_TYPE_TITLES[session.sessionType] || session.sessionType;
  return "Training";
}

// --- Helpers ---

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getOriginalDate(session: Session, weekNumber: number, startDate: Date): string {
  const dow = DOW_GERMAN[session.dayOfWeek || ""] ?? 1;
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  const diff = dow === 0 ? 6 : dow - 1;
  const d = new Date(weekStart);
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

function getAllSessions(blocks: Block[]): { session: Session; weekNumber: number }[] {
  const result: { session: Session; weekNumber: number }[] = [];
  for (const block of blocks) {
    for (const week of block.weeks || []) {
      for (const session of week.sessions || []) {
        result.push({ session, weekNumber: week.weekNumber || 1 });
      }
    }
  }
  return result;
}

function formatDateLabel(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

// --- Draggable Session Card ---

function DraggableSessionCard({
  session,
  isOverridden,
  onUndo,
}: {
  session: Session;
  isOverridden: boolean;
  onUndo?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.sessionId || "",
  });

  const exercises = session.exercises || session.mainBlock || [];
  const duration = session.durationMin || session.durationMinutes;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "glass rounded-xl p-4 transition-all",
        isDragging && "opacity-40 ring-1 ring-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground mt-0.5"
          aria-label="Drag session"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-foreground truncate">
            {getSessionTitle(session)}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {duration && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {duration} Min
              </span>
            )}
            {session.sessionType && (
              <Badge className="bg-primary/15 text-primary border-0 text-xs">
                {SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}
              </Badge>
            )}
            {isOverridden && (
              <Badge className="bg-yellow-900/30 text-yellow-400 border-0 text-xs">
                verschoben
              </Badge>
            )}
          </div>
        </div>
        {isOverridden && onUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
          >
            <Undo2 className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {exercises.length > 0 && (
        <div className="mt-3 space-y-1">
          {exercises.slice(0, 4).map((ex, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground/80 truncate">{ex.name || "—"}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {ex.sets ? `${ex.sets}×${ex.reps || ""}` : ex.distance || ex.duration || ""}
              </span>
            </div>
          ))}
          {exercises.length > 4 && (
            <p className="text-xs text-muted-foreground">+{exercises.length - 4} weitere</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Droppable Day Cell ---

function DroppableDayCell({
  dateStr,
  dow,
  dateNum,
  isActive,
  isToday,
  sessionCount,
  completedCount,
  onClick,
}: {
  dateStr: string;
  dow: number;
  dateNum: number;
  isActive: boolean;
  isToday: boolean;
  sessionCount: number;
  completedCount: number;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  const hasSession = sessionCount > 0;
  const allDone = hasSession && completedCount === sessionCount;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-bold transition-all min-w-0",
        isActive
          ? "bg-primary/15 ring-2 ring-primary"
          : isOver
          ? "bg-primary/10 ring-1 ring-primary/50"
          : isToday
          ? "bg-secondary"
          : "hover:bg-secondary/50"
      )}
    >
      <span className="uppercase text-muted-foreground text-[10px]">{DOW_SHORT[dow]}</span>
      <span className={cn(
        "text-sm font-extrabold",
        isActive ? "text-primary" : isToday ? "text-foreground" : "text-foreground/80"
      )}>
        {dateNum}
      </span>
      {/* Session indicator dot */}
      <div className="h-1.5">
        {hasSession && (
          <span className={cn(
            "block h-1.5 w-1.5 rounded-full",
            allDone ? "bg-primary" : "bg-primary/50"
          )} />
        )}
      </div>
    </button>
  );
}

// --- Drag Overlay Card ---

function DragOverlayCard({ session }: { session: Session }) {
  return (
    <div className="glass-strong rounded-xl p-3 w-[260px] shadow-xl">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-primary" />
        <span className="text-sm font-extrabold text-foreground truncate">
          {getSessionTitle(session)}
        </span>
      </div>
    </div>
  );
}

// === Main Component ===

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanShape | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [loading, setLoading] = useState(true);
  const [viewWeek, setViewWeek] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [logMap, setLogMap] = useState<Record<string, SessionLog>>({});
  const [planId, setPlanId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.plan_data) setPlanData(data.plan_data as unknown as PlanShape);
        if (data?.onboarding_data) setOnboardingData(data.onboarding_data);
        setOverrides((data as any)?.session_overrides || {});
        if (data?.id) setPlanId(data.id);
        setLoading(false);
      });

    supabase
      .from("session_logs")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data: logs }) => {
        const map: Record<string, SessionLog> = {};
        logs?.forEach((log) => {
          map[`${log.session_id}_${log.scheduled_date}`] = log as unknown as SessionLog;
        });
        setLogMap(map);
      });
  }, [user]);

  const handleLogChange = useCallback((log: SessionLog) => {
    setLogMap((prev) => ({
      ...prev,
      [`${log.session_id}_${log.scheduled_date}`]: log,
    }));
  }, []);

  const p = planData?.plan;
  const totalWeeks = p?.totalWeeks || 1;
  const blocks = p?.blocks || [];

  const startDate = useMemo(() => {
    const raw = onboardingData?.startDate || (planData as any)?.onboarding_data?.startDate;
    return raw ? new Date(raw) : null;
  }, [onboardingData, planData]);

  const currentWeek = useMemo(() => {
    if (!startDate) return 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (7 * 86400000)));
  }, [startDate]);

  useEffect(() => {
    setViewWeek(Math.min(currentWeek, totalWeeks));
  }, [currentWeek, totalWeeks]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(toDateStr(new Date()));
    }
  }, [selectedDate]);

  const allSessionsWithDates = useMemo(() => {
    if (!startDate) return [];
    const all = getAllSessions(blocks);
    return all.map(({ session, weekNumber }) => {
      const originalDate = getOriginalDate(session, weekNumber, startDate);
      const resolvedDate = overrides[session.sessionId || ""] || originalDate;
      return { session, weekNumber, originalDate, resolvedDate, isOverridden: !!overrides[session.sessionId || ""] };
    });
  }, [blocks, startDate, overrides]);

  const weekDates = useMemo(() => {
    if (!startDate) return [];
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (viewWeek - 1) * 7);
    const day = weekStart.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startDate, viewWeek]);

  const sessionsForDate = useCallback(
    (dateStr: string) => allSessionsWithDates.filter((s) => s.resolvedDate === dateStr),
    [allSessionsWithDates]
  );

  const selectedSessions = useMemo(
    () => sessionsForDate(selectedDate),
    [sessionsForDate, selectedDate]
  );

  const currentBlock = useMemo(() => {
    return blocks.find((b) => viewWeek >= (b.weekStart || 0) && viewWeek <= (b.weekEnd || 0)) || blocks[0];
  }, [blocks, viewWeek]);

  const weekData = useMemo(() => {
    return currentBlock?.weeks?.find((w) => w.weekNumber === viewWeek);
  }, [currentBlock, viewWeek]);

  const canGoPrev = viewWeek > 1;
  const canGoNext = viewWeek < totalWeeks;

  const activeDragSession = useMemo(() => {
    if (!activeSessionId) return null;
    return allSessionsWithDates.find((s) => s.session.sessionId === activeSessionId)?.session || null;
  }, [activeSessionId, allSessionsWithDates]);

  const persistOverrides = useCallback(
    async (newOverrides: Overrides) => {
      if (!user) return false;
      const { error } = await supabase
        .from("training_plans")
        .update({ session_overrides: newOverrides } as any)
        .eq("user_id", user.id)
        .eq("status", "ready");
      return !error;
    },
    [user]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSessionId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveSessionId(null);
      const { active, over } = event;
      if (!over) return;
      const sessionId = active.id as string;
      const targetDate = over.id as string;
      const entry = allSessionsWithDates.find((s) => s.session.sessionId === sessionId);
      if (!entry || entry.resolvedDate === targetDate) return;

      const oldOverrides = { ...overrides };
      const newOverrides = { ...overrides, [sessionId]: targetDate };
      setOverrides(newOverrides);

      const ok = await persistOverrides(newOverrides);
      if (!ok) {
        setOverrides(oldOverrides);
        toast({ title: "Fehler", description: "Session konnte nicht verschoben werden.", variant: "destructive" });
      }
    },
    [allSessionsWithDates, overrides, persistOverrides]
  );

  const handleUndo = useCallback(
    async (sessionId: string) => {
      const oldOverrides = { ...overrides };
      const newOverrides = { ...overrides };
      delete newOverrides[sessionId];
      setOverrides(newOverrides);

      const ok = await persistOverrides(newOverrides);
      if (!ok) {
        setOverrides(oldOverrides);
        toast({ title: "Fehler", description: "Zurücksetzen fehlgeschlagen.", variant: "destructive" });
      }
    },
    [overrides, persistOverrides]
  );

  const weekHasOverrides = useMemo(() => {
    if (weekDates.length === 0) return false;
    const mondayStr = toDateStr(weekDates[0]);
    const sundayStr = toDateStr(weekDates[6]);
    return allSessionsWithDates.some((entry) => {
      const sid = entry.session.sessionId || "";
      if (!overrides[sid]) return false;
      if (overrides[sid] >= mondayStr && overrides[sid] <= sundayStr) return true;
      if (entry.originalDate >= mondayStr && entry.originalDate <= sundayStr) return true;
      return false;
    });
  }, [allSessionsWithDates, overrides, weekDates]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetWeek = useCallback(async () => {
    if (weekDates.length === 0 || !user) return;
    const mondayStr = toDateStr(weekDates[0]);
    const sundayStr = toDateStr(weekDates[6]);
    const affectedIds: string[] = [];
    allSessionsWithDates.forEach((entry) => {
      const sid = entry.session.sessionId || "";
      if (!overrides[sid]) return;
      if (overrides[sid] >= mondayStr && overrides[sid] <= sundayStr) affectedIds.push(sid);
      else if (entry.originalDate >= mondayStr && entry.originalDate <= sundayStr) affectedIds.push(sid);
    });

    const oldOverrides = { ...overrides };
    const newOverrides = { ...overrides };
    affectedIds.forEach((id) => delete newOverrides[id]);
    setOverrides(newOverrides);
    setShowResetConfirm(false);

    const ok = await persistOverrides(newOverrides);
    if (!ok) {
      setOverrides(oldOverrides);
      toast({ title: "Fehler", description: "Woche konnte nicht zurückgesetzt werden.", variant: "destructive" });
    }
  }, [weekDates, allSessionsWithDates, overrides, user, persistOverrides]);

  const todayStr = toDateStr(new Date());

  // Month label for header
  const monthLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const mid = weekDates[3];
    const months = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
    return `${months[mid.getMonth()]} ${mid.getFullYear()}`;
  }, [weekDates]);

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <TopNav />

        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-extrabold text-foreground">{monthLabel}</p>
            <button
              onClick={() => {
                setViewWeek(Math.min(currentWeek, totalWeeks));
                setSelectedDate(todayStr);
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Heute
            </button>
          </div>

          {/* Week nav */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" disabled={!canGoPrev} onClick={() => setViewWeek((v) => v - 1)} className="text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">
                Woche {viewWeek}
              </p>
              {currentBlock?.blockName && (
                <p className="text-xs text-muted-foreground">
                  {currentBlock.blockName}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" disabled={!canGoNext} onClick={() => setViewWeek((v) => v + 1)} className="text-muted-foreground">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day strip */}
          <div className="flex gap-1 rounded-xl glass p-2 mb-4">
            {weekDates.map((date) => {
              const dateStr = toDateStr(date);
              const dow = date.getDay();
              const daySessions = sessionsForDate(dateStr);
              const count = daySessions.length;
              const completedCount = daySessions.filter(
                (s) => logMap[`${s.session.sessionId}_${dateStr}`]?.completed
              ).length;
              return (
                <DroppableDayCell
                  key={dateStr}
                  dateStr={dateStr}
                  dow={dow}
                  dateNum={date.getDate()}
                  isActive={selectedDate === dateStr}
                  isToday={dateStr === todayStr}
                  sessionCount={count}
                  completedCount={completedCount}
                  onClick={() => setSelectedDate(dateStr)}
                />
              );
            })}
          </div>

          {/* Reset week */}
          {weekHasOverrides && (
            <div className="mb-4">
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <RotateCcw className="h-3 w-3" />
                  Woche zurücksetzen
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 glass rounded-lg p-3">
                  <p className="text-xs text-foreground">Alle Verschiebungen zurücksetzen?</p>
                  <Button size="sm" variant="destructive" onClick={handleResetWeek} className="text-xs h-7">Ja</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowResetConfirm(false)} className="text-xs h-7">Nein</Button>
                </div>
              )}
            </div>
          )}

          {/* Selected date label */}
          {selectedDate && (
            <div className="mb-3">
              <p className="text-sm font-bold text-muted-foreground">
                {(() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  return `${formatDateLabel(d)} ${DOW_LONG[d.getDay()]}`;
                })()}
              </p>
            </div>
          )}

          {/* Day detail */}
          <div className="space-y-4">
            {selectedSessions.length > 0 ? (
              <>
                {weekData?.coachNote && (
                  <div className="glass-accent rounded-xl p-3">
                    <p className="text-sm italic text-foreground/80">💬 {weekData.coachNote}</p>
                  </div>
                )}
                {selectedSessions.map((entry) => (
                  <div key={entry.session.sessionId} className="space-y-3">
                    <DraggableSessionCard
                      session={entry.session}
                      isOverridden={entry.isOverridden}
                      onUndo={entry.isOverridden ? () => handleUndo(entry.session.sessionId || "") : undefined}
                    />
                    {planId && (
                      <SessionLogCard
                        sessionId={entry.session.sessionId || ""}
                        scheduledDate={entry.resolvedDate}
                        planId={planId}
                        existingLog={logMap[`${entry.session.sessionId}_${entry.resolvedDate}`] || null}
                        onLogChange={handleLogChange}
                      />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-lg font-extrabold uppercase text-foreground">Ruhetag</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Erholung ist genauso wichtig wie das Training.
                </p>
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      <DragOverlay>
        {activeDragSession && <DragOverlayCard session={activeDragSession} />}
      </DragOverlay>
    </DndContext>
  );
}
