import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Zap, LogOut, RefreshCw, Trophy, Clock, Dumbbell } from "lucide-react";

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
  zone1: "Zone 1",
  zone2: "Zone 2",
  zone3: "Zone 3",
  zone4: "Zone 4",
  zone5: "Zone 5",
  racePace: "Race Pace",
};

const ZONE_COLORS: Record<string, string> = {
  zone1: "bg-muted text-muted-foreground",
  zone2: "bg-secondary text-secondary-foreground",
  zone3: "bg-primary/20 text-primary",
  zone4: "bg-primary/40 text-primary",
  zone5: "bg-primary/70 text-primary-foreground",
  racePace: "bg-primary text-primary-foreground",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  combo: "Kombi",
  run: "Lauf",
  strength: "Kraft",
  hyrox: "HYROX",
  recovery: "Recovery",
  race: "Wettkampf",
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
        <div className="animate-pulse">
          <Zap className="h-16 w-16 text-primary drop-shadow-[0_0_24px_hsl(var(--primary)/0.6)]" />
        </div>
        <p className="mt-4 text-muted-foreground">Plan wird geladen…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <Zap className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Kein Plan gefunden</h1>
        <p className="mt-2 text-muted-foreground">Starte jetzt dein Onboarding und erstelle deinen Plan.</p>
        <Button onClick={() => navigate("/onboarding")} className="mt-6 uppercase tracking-wider">
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="border-b border-border bg-card px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-widest text-foreground">
            HYROX<span className="text-primary text-glow"> COACH</span>
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase tracking-wider text-foreground sm:text-4xl">
            {athleteName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={category === "PRO" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
              {category}
            </Badge>
            {hasExp !== undefined && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                <Trophy className="mr-1 h-3 w-3" />
                {hasExp ? "Race Veteran" : "First Timer"}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {p?.raceName && (
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5" />
                {p.raceName} — {formatDate(p.raceDate)}
              </span>
            )}
            {p?.totalWeeks && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {p.totalWeeks}-Wochen-Plan
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {/* Training Zones */}
        {Object.keys(zones).length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-foreground">
              Deine Trainingszonen
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(zones).map(([key, value]) => (
                <div
                  key={key}
                  className={`rounded-lg p-4 text-center ${ZONE_COLORS[key] || "bg-secondary text-secondary-foreground"}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {ZONE_LABELS[key] || key}
                  </p>
                  <p className="mt-1 text-lg font-black">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Block Navigation */}
        {blocks.length > 0 && (
          <>
            <section className="mb-6">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-3">
                  {blocks.map((block, i) => (
                    <button
                      key={block.blockNumber ?? i}
                      onClick={() => setActiveBlock(i)}
                      className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                        i === activeBlock
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      Block {block.blockNumber ?? i + 1}: {block.blockName || "—"}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>

            {/* Active Block Content */}
            {currentBlock && (
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-black uppercase tracking-wider text-foreground">
                    {currentBlock.blockName}
                  </h2>
                  {currentBlock.blockGoal && (
                    <p className="mt-1 text-sm text-muted-foreground">{currentBlock.blockGoal}</p>
                  )}
                </div>

                {currentBlock.coachIntro && (
                  <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm italic text-foreground/80">
                      💬 {currentBlock.coachIntro}
                    </p>
                  </div>
                )}

                {/* Weeks Accordion */}
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
                            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                              Deload
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {week.coachNote && (
                          <p className="mb-4 text-sm italic text-muted-foreground">
                            {week.coachNote}
                          </p>
                        )}

                        <div className="space-y-4">
                          {(week.sessions || []).map((session, si) => (
                            <SessionCard key={session.sessionId ?? si} session={session} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-8 pb-12">
          <Button
            onClick={handleRegenerate}
            disabled={deleting}
            variant="outline"
            className="w-full max-w-xs uppercase tracking-wider"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${deleting ? "animate-spin" : ""}`} />
            {deleting ? "Wird gelöscht…" : "Plan neu erstellen"}
          </Button>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full max-w-xs uppercase tracking-wider text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </footer>
      </main>
    </div>
  );
}

/* ─── Session Card ─── */

function SessionCard({ session }: { session: Session }) {
  const exercises = session.mainBlock || session.exercises || [];
  const duration = session.durationMinutes ?? session.durationMin;
  const type = session.sessionType ? SESSION_TYPE_LABELS[session.sessionType] || session.sessionType : null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {session.dayOfWeek && (
            <CardTitle className="text-base">{session.dayOfWeek}</CardTitle>
          )}
          {type && (
            <Badge variant="secondary" className="text-xs uppercase">
              {type}
            </Badge>
          )}
          {duration && (
            <span className="text-xs text-muted-foreground">{duration} Min</span>
          )}
        </div>
        {(session.title || session.focus) && (
          <p className="text-sm text-muted-foreground">{session.title || session.focus}</p>
        )}
        {session.coachIntro && (
          <p className="mt-1 text-xs italic text-muted-foreground/70">{session.coachIntro}</p>
        )}
      </CardHeader>

      {exercises.length > 0 && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Übung</th>
                  <th className="pb-2 pr-3 font-medium">Volumen</th>
                  <th className="hidden pb-2 pr-3 font-medium sm:table-cell">Zone</th>
                  <th className="hidden pb-2 font-medium md:table-cell">Notizen</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-foreground">{ex.name || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {formatVolume(ex)}
                    </td>
                    <td className="hidden py-2 pr-3 sm:table-cell">
                      {ex.zone ? (
                        <Badge variant="outline" className="text-xs border-border">
                          {ZONE_LABELS[ex.zone] || ex.zone}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="hidden py-2 text-xs text-muted-foreground md:table-cell">
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
