import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";

const MESSAGES = [
  "Dein KI Coach analysiert deine Trainingsdaten…",
  "Laufpace, Stationssplits und Erholung werden berechnet…",
  "Ein professioneller Trainingsplan braucht Zeit. Wir bauen ihn gerade für dich.",
  "Deine Schwächen werden gezielt adressiert…",
  "Trainingsblöcke, Deload-Wochen und Peaking werden strukturiert…",
  "Fast fertig — dein Plan nimmt Form an.",
];

export default function GeneratingPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);

  const checkPlanReady = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("training_plans")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .maybeSingle();
    if (data) navigate("/plan");
  }, [user, navigate]);

  // Initial check + realtime + polling fallback
  useEffect(() => {
    if (!user) return;

    checkPlanReady();

    const channel = supabase
      .channel("plan-ready")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "training_plans",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new.status === "ready") navigate("/plan");
        }
      )
      .subscribe();

    const interval = setInterval(checkPlanReady, 30_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, navigate, checkPlanReady]);

  // Rotate messages every 8s
  useEffect(() => {
    const timer = setInterval(
      () => setMessageIndex((i) => (i + 1) % MESSAGES.length),
      8000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-8 animate-pulse">
        <Zap className="h-20 w-20 text-primary drop-shadow-[0_0_24px_hsl(var(--primary)/0.6)]" />
      </div>

      <p className="mx-auto max-w-lg text-2xl font-bold tracking-wide text-foreground transition-opacity duration-700">
        {MESSAGES[messageIndex]}
      </p>

      <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
        Unsere KI erstellt deinen Plan mit professioneller Präzision. Das kann
        1–3 Minuten dauern.
      </p>

      <div className="mt-10 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-indeterminate rounded-full bg-primary" />
      </div>
    </div>
  );
}
