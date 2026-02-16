import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ChevronLeft, ChevronRight, GripVertical, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { toast } from "@/hooks/use-toast";
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

const DOW_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DOW_GERMAN: Record<string, number> = {
  Sonntag: 0, Montag: 1, Dienstag: 2, Mittwoch: 3,
  Donnerstag: 4, Freitag: 5, Samstag: 6,
};
const DOW_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(DOW_GERMAN).map(([k, v]) => [v, k])
);

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

const ZONE_COLORS: Record<string, string> = {
  zone1: "bg-muted text-muted-foreground",
  zone2: "bg-blue-900/40 text-blue-300",
  zone3: "bg-yellow-900/40 text-yellow-300",
  zone4: "bg-orange-900/40 text-orange-300",
  zone5: "bg-red-900/40 text-red-300",
  racePace: "bg-primary text-primary-foreground",
};

const ZONE_LABELS: Record<string, string> = {
  zone1: "Zone 1", zone2: "Zone 2", zone3: "Zone 3",
  zone4: "Zone 4", zone5: "Zone 5", racePace: "Race Pace",
};

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
  // Find the date for this dow within the week
  const diff = dow === 0 ? 6 : dow - 1; // Mon=0, ..., Sun=6
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

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "border-border bg-card transition-all",
        isDragging && "opacity-40 border-primary"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
            aria-label="Drag session"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-black text-foreground truncate">
              {getSessionTitle(session)}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {session.sessionType && (
                <Badge className="bg-primary text-primary-foreground text-xs uppercase">
                  {SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}
                </Badge>
              )}
              {(session.durationMin || session.durationMinutes) && (
                <Badge variant="outline" className="text-xs">
                  {session.durationMin || session.durationMinutes} Min
                </Badge>
              )}
              {isOverridden && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
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
              <Undo2 className="h-3 w-3" /> Zurücksetzen
            </button>
          )}
        </div>
        {exercises.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {exercises.slice(0, 3).map((ex, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {ex.name || "Übung"}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      {exercises.length > 0 && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Übung</th>
                  <th className="pb-2 pr-3 font-medium">Sets</th>
                  <th className="pb-2 pr-3 font-medium">Reps</th>
                  <th className="pb-2 pr-3 font-medium">Zone</th>
                  <th className="hidden pb-2 font-medium sm:table-cell">Notizen</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-foreground">{ex.name || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{ex.sets || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{ex.reps || ex.distance || "—"}</td>
                    <td className="py-2 pr-3">
                      {ex.zone ? (
                        <Badge className={cn("text-xs", ZONE_COLORS[ex.zone] || "bg-secondary text-secondary-foreground")}>
                          {ZONE_LABELS[ex.zone] || ex.zone}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="hidden py-2 text-xs text-muted-foreground sm:table-cell">
                      {ex.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// --- Droppable Day Cell ---

function DroppableDayCell({
  dateStr,
  dow,
  dateNum,
  isActive,
  sessionCount,
  isOver,
  onClick,
}: {
  dateStr: string;
  dow: number;
  dateNum: number;
  isActive: boolean;
  sessionCount: number;
  isOver: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver: dropOver } = useDroppable({ id: dateStr });
  const highlighted = isOver || dropOver;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-bold transition-all",
        isActive
          ? "bg-primary text-primary-foreground"
          : highlighted
          ? "bg-primary/30 ring-2 ring-primary text-foreground"
          : "text-muted-foreground hover:bg-secondary"
      )}
    >
      <span className="uppercase">{DOW_SHORT[dow]}</span>
      <span className={cn("text-sm", isActive ? "text-primary-foreground" : "text-foreground")}>
        {dateNum}
      </span>
      {sessionCount > 0 && !isActive && (
        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
      )}
      {sessionCount > 1 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {sessionCount}
        </span>
      )}
    </button>
  );
}

// --- Drag Overlay Card ---

function DragOverlayCard({ session }: { session: Session }) {
  return (
    <Card className="border-primary bg-card/90 shadow-xl shadow-primary/20 w-[280px]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-black text-foreground truncate">
            {getSessionTitle(session)}
          </CardTitle>
          {session.sessionType && (
            <Badge className="bg-primary text-primary-foreground text-xs uppercase">
              {SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  // --- Load data ---
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
        setLoading(false);
      });
  }, [user]);

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

  // Set initial selected date to today
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(toDateStr(new Date()));
    }
  }, [selectedDate]);

  // --- All sessions with resolved dates ---
  const allSessionsWithDates = useMemo(() => {
    if (!startDate) return [];
    const all = getAllSessions(blocks);
    return all.map(({ session, weekNumber }) => {
      const originalDate = getOriginalDate(session, weekNumber, startDate);
      const resolvedDate = overrides[session.sessionId || ""] || originalDate;
      return {
        session,
        weekNumber,
        originalDate,
        resolvedDate,
        isOverridden: !!overrides[session.sessionId || ""],
      };
    });
  }, [blocks, startDate, overrides]);

  // --- Week dates ---
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

  // --- Sessions for each day in current week ---
  const sessionsForDate = useCallback(
    (dateStr: string) => {
      return allSessionsWithDates.filter((s) => s.resolvedDate === dateStr);
    },
    [allSessionsWithDates]
  );

  const selectedSessions = useMemo(
    () => sessionsForDate(selectedDate),
    [sessionsForDate, selectedDate]
  );

  // --- Current block ---
  const currentBlock = useMemo(() => {
    return blocks.find((b) => viewWeek >= (b.weekStart || 0) && viewWeek <= (b.weekEnd || 0)) || blocks[0];
  }, [blocks, viewWeek]);

  const weekData = useMemo(() => {
    return currentBlock?.weeks?.find((w) => w.weekNumber === viewWeek);
  }, [currentBlock, viewWeek]);

  const canGoPrev = viewWeek > 1;
  const canGoNext = viewWeek < totalWeeks;

  // --- Active dragging session ---
  const activeDragSession = useMemo(() => {
    if (!activeSessionId) return null;
    return allSessionsWithDates.find((s) => s.session.sessionId === activeSessionId)?.session || null;
  }, [activeSessionId, allSessionsWithDates]);

  // --- Persist overrides ---
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

  // --- Drag handlers ---
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

      // Find current resolved date
      const entry = allSessionsWithDates.find((s) => s.session.sessionId === sessionId);
      if (!entry || entry.resolvedDate === targetDate) return;

      // Optimistic update
      const oldOverrides = { ...overrides };
      const newOverrides = { ...overrides, [sessionId]: targetDate };
      setOverrides(newOverrides);

      const ok = await persistOverrides(newOverrides);
      if (!ok) {
        setOverrides(oldOverrides);
        toast({
          title: "Fehler",
          description: "Session konnte nicht verschoben werden.",
          variant: "destructive",
        });
      }
    },
    [allSessionsWithDates, overrides, persistOverrides]
  );

  // --- Undo ---
  const handleUndo = useCallback(
    async (sessionId: string) => {
      const oldOverrides = { ...overrides };
      const newOverrides = { ...overrides };
      delete newOverrides[sessionId];
      setOverrides(newOverrides);

      const ok = await persistOverrides(newOverrides);
      if (!ok) {
        setOverrides(oldOverrides);
        toast({
          title: "Fehler",
          description: "Zurücksetzen fehlgeschlagen.",
          variant: "destructive",
        });
      }
    },
    [overrides, persistOverrides]
  );

  // --- Render ---

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background pb-20">
        <header className="px-4 pt-6 pb-2 sm:px-8">
          <p className="text-sm font-black uppercase tracking-widest text-foreground">
            HYROX<span className="text-primary text-glow"> COACH</span>
          </p>
        </header>

        <main className="mx-auto max-w-lg px-4 sm:px-8">
          {/* Week nav */}
          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" size="icon" disabled={!canGoPrev} onClick={() => setViewWeek((v) => v - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-black uppercase tracking-wider text-foreground">
                Woche {viewWeek}
              </p>
              {currentBlock?.blockName && (
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {currentBlock.blockName}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" disabled={!canGoNext} onClick={() => setViewWeek((v) => v + 1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day strip */}
          <div className="flex justify-between gap-1 rounded-xl bg-card p-2">
            {weekDates.map((date, i) => {
              const dateStr = toDateStr(date);
              const dow = date.getDay();
              const count = sessionsForDate(dateStr).length;
              return (
                <DroppableDayCell
                  key={dateStr}
                  dateStr={dateStr}
                  dow={dow}
                  dateNum={date.getDate()}
                  isActive={selectedDate === dateStr}
                  sessionCount={count}
                  isOver={false}
                  onClick={() => setSelectedDate(dateStr)}
                />
              );
            })}
          </div>

          {/* Day detail */}
          <div className="mt-4 space-y-4">
            {selectedSessions.length > 0 ? (
              <>
                {weekData?.coachNote && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm italic text-foreground/80">💬 {weekData.coachNote}</p>
                  </div>
                )}
                {selectedSessions.map((entry) => (
                  <DraggableSessionCard
                    key={entry.session.sessionId}
                    session={entry.session}
                    isOverridden={entry.isOverridden}
                    onUndo={entry.isOverridden ? () => handleUndo(entry.session.sessionId || "") : undefined}
                  />
                ))}
              </>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <p className="text-2xl font-black uppercase text-foreground">RUHETAG</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Erholung ist genauso wichtig wie das Training selbst. Nutze den Tag zur Regeneration.
                  </p>
                </CardContent>
              </Card>
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
