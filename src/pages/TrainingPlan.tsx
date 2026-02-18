import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Zap, LogOut, RefreshCw, Trophy, Clock, Dumbbell, Target, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { cn } from "@/lib/utils";

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
  restSeconds?: number;
}

interface Session {
  sessionId?: string;
  dayOfWeek?: string;
  sessionType?: string;
  title?: string;
  focus?: string;
  durationMinutes?: number;
  durationMin?: number;
  intensityZone?: string;
  coachIntro?: string;
  exercises?: Exercise[];
  mainBlock?: Exercise[];
  warmup?: any[];
  cooldown?: any[];
}

interface Week {
  weekNumber?: number;
  weekGoal?: string;
  totalSessions?: number;
  isDeloadWeek?: boolean;
  coachNote?: string;
  sessions?: Session[];
}

interface Block {
  blockNumber?: number;
  blockName?: string;
  blockGoal?: string;
  coachIntro?: string;
  weekStart?: number;
  weekEnd?: number;
  weeks?: Week[];
}

interface PlanData {
  userId?: string;
  athleteName?: string;
  category?: string;
  hasRaceExperience?: boolean;
  trainingZones?: Record<string, string>;
  plan?: {
    athleteName?: string;
    totalWeeks?: number;
    raceDate?: string;
    raceName?: string;
    category?: string;
    hasRaceExperience?: boolean;
    trainingZones?: Record<string, string>;
    blocks?: Block[];
  };
}

const ZONE_LABELS: Record<string, string> = {
  zone1: "Zone 1", zone2: "Zone 2", zone3: "Zone 3",
  zone4: "Zone 4", zone5: "Zone 5", racePace: "Race Pace",
};

const ZONE_COLORS: Record<string, string> = {
  zone1: "border-l-muted-foreground",
  zone2: "border-l-blue-500",
  zone3: "border-l-yellow-500",
  zone4: "border-l-orange-500",
  zone5: "border-l-red-500",
  racePace: "border-l-primary",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  combo: "Kombi", run: "Lauf", strength: "Kraft",
  hyrox: "HYROX", recovery: "Recovery", race: "Wettkampf",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function TrainingPlan() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBlock, setActiveBlock] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .maybeSingle();
    if (data?.plan_data) {
      setPlan(data.plan_data as unknown as PlanData);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchPlan();
    if (!authLoading && !user) setLoading(false);
  }, [user, authLoading, fetchPlan]);

  const handleRegenerate = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    await supabase.from("training_plans").delete().eq("user_id", user.id);
    navigate("/onboarding");
  }, [user, navigate]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Zap className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <Zap className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Kein Plan gefunden</h1>
        <p className="mt-2 text-muted-foreground">Starte jetzt dein Onboarding.</p>
        <Button onClick={() => navigate("/onboarding")} className="mt-6 uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
          Zum Onboarding
        </Button>
      </div>
    );
  }

  const p = plan.plan;
  const zones = p?.trainingZones || plan.trainingZones || {};
  const blocks = p?.blocks || [];
  const currentBlock = blocks[activeBlock];
  const athleteName = p?.athleteName || plan.athleteName || "Athlet";
  const category = (p?.category || plan.category || "open").toUpperCase();
  const hasExp = p?.hasRaceExperience ?? plan.hasRaceExperience;
  const totalWeeks = p?.totalWeeks || 0;

  // Current week for progress
  const currentWeek = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Approximate
    return Math.min(totalWeeks, Math.max(1, Math.ceil((today.getTime() - new Date(p?.raceDate || today).getTime()) / (7 * 86400000) + totalWeeks)));
  })();

  const blockProgress = (() => {
    if (!currentBlock) return 0;
    const ws = currentBlock.weekStart || 1;
    const we = currentBlock.weekEnd || ws;
    const span = we - ws + 1;
    return Math.min(100, Math.round(((currentWeek - ws) / span) * 100));
  })();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <TopNav />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-8 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-extrabold text-xl">
            {athleteName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-foreground">{athleteName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary/15 text-primary border-0 text-xs">{category}</Badge>
              {hasExp !== undefined && (
                <Badge className="bg-secondary text-secondary-foreground border-0 text-xs">
                  <Trophy className="mr-1 h-3 w-3" />
                  {hasExp ? "Race Veteran" : "First Timer"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Current Block Card */}
        {currentBlock && (
          <div className="glass-accent rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Aktueller Block
            </p>
            <h2 className="text-xl font-extrabold text-foreground">{currentBlock.blockName}</h2>
            {currentBlock.blockGoal && (
              <p className="text-sm text-muted-foreground">{currentBlock.blockGoal}</p>
            )}
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fortschritt</span>
                <span>{blockProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${blockProgress}%` }}
                />
              </div>
            </div>
            {p?.raceName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                {p.raceName} — {formatDate(p.raceDate)}
              </div>
            )}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{totalWeeks}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wochen</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{blocks.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blöcke</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">
              {blocks.reduce((sum, b) => sum + (b.weeks || []).reduce((ws, w) => ws + (w.sessions?.length || 0), 0), 0)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</p>
          </div>
        </div>

        {/* Training Zones */}
        {Object.keys(zones).length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trainingszonen
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(zones).map(([key, value]) => {
                if (key === "targetRacePaceMin" || key === "targetRacePaceMax" || key === "targetRacePaceNote") return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "glass rounded-xl p-3 border-l-4",
                      ZONE_COLORS[key] || "border-l-muted"
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ZONE_LABELS[key] || key}
                    </p>
                    <p className="text-base font-extrabold text-foreground mt-0.5">{value}</p>
                  </div>
                );
              })}
              {/* Target Race Pace */}
              {((zones as any).targetRacePaceMin) && (
                <div className="glass rounded-xl p-3 border-l-4 border-l-blue-500">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Ziel Race Pace
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">
                    {(zones as any).targetRacePaceMin} – {(zones as any).targetRacePaceMax}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block Navigation */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trainingsblöcke
            </p>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-3">
                {blocks.map((block, i) => (
                  <button
                    key={block.blockNumber ?? i}
                    onClick={() => setActiveBlock(i)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all",
                      i === activeBlock
                        ? "bg-primary text-primary-foreground"
                        : "glass text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Block {block.blockNumber ?? i + 1}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Active Block Content */}
            {currentBlock && (
              <>
                {currentBlock.coachIntro && (
                  <div className="glass-accent rounded-xl p-4">
                    <p className="text-sm italic text-foreground/80">
                      💬 {currentBlock.coachIntro}
                    </p>
                  </div>
                )}

                <Accordion type="single" collapsible defaultValue="week-0">
                  {(currentBlock.weeks || []).map((week, wi) => (
                    <AccordionItem key={wi} value={`week-${wi}`} className="border-border">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-wrap items-center gap-2 text-left">
                          <span className="font-bold text-foreground">
                            Woche {week.weekNumber ?? wi + 1}
                          </span>
                          {week.weekGoal && (
                            <span className="text-sm text-muted-foreground">— {week.weekGoal}</span>
                          )}
                          {week.isDeloadWeek && (
                            <Badge className="bg-primary/15 text-primary border-0 text-xs">Deload</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {week.coachNote && (
                          <p className="mb-4 text-sm italic text-muted-foreground">{week.coachNote}</p>
                        )}
                        <div className="space-y-3">
                          {(week.sessions || []).map((session, si) => (
                            <SessionCard key={session.sessionId ?? si} session={session} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-4 border-t border-border pt-8 pb-8">
          <Button
            onClick={handleRegenerate}
            disabled={deleting}
            variant="outline"
            className="w-full max-w-xs uppercase tracking-wider rounded-full border-border text-foreground"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", deleting && "animate-spin")} />
            {deleting ? "Wird gelöscht…" : "Plan neu erstellen"}
          </Button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

/* ─── Session Card ─── */

function SessionCard({ session }: { session: { sessionId?: string; dayOfWeek?: string; sessionType?: string; title?: string; focus?: string; durationMinutes?: number; durationMin?: number; coachIntro?: string; exercises?: Exercise[]; mainBlock?: Exercise[] } }) {
  const exercises = session.mainBlock || session.exercises || [];
  const duration = session.durationMinutes ?? session.durationMin;
  const type = session.sessionType ? SESSION_TYPE_LABELS[session.sessionType] || session.sessionType : null;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {session.dayOfWeek && (
          <span className="text-sm font-bold text-foreground">{session.dayOfWeek}</span>
        )}
        {type && (
          <Badge className="bg-primary/15 text-primary border-0 text-xs uppercase">{type}</Badge>
        )}
        {duration && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {duration} Min
          </span>
        )}
      </div>
      {(session.title || session.focus) && (
        <p className="text-sm text-muted-foreground mb-2">{session.title || session.focus}</p>
      )}
      {session.coachIntro && (
        <p className="text-xs italic text-muted-foreground/70 mb-2">{session.coachIntro}</p>
      )}

      {exercises.length > 0 && (
        <div className="space-y-1 mt-2">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground/80 truncate">{ex.name || "—"}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {formatVolume(ex)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatVolume(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets}×`);
  if (ex.reps) parts.push(String(ex.reps));
  if (ex.distance && !ex.reps) parts.push(String(ex.distance));
  if (ex.pace) parts.push(`@ ${ex.pace}`);
  if (ex.duration && !ex.reps && !ex.distance) parts.push(String(ex.duration));
  if (ex.weight) parts.push(`(${ex.weight})`);
  return parts.join(" ") || "—";
}
