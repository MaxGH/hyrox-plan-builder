import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";

const MESSAGES = [
  "Dein Plan wird gerade von unserer KI erstellt…",
  "Das dauert einen Moment — Qualität braucht Zeit.",
  "Laufpace, Splits und Erholung werden analysiert…",
  "Deine Schwächen werden gezielt in den Plan eingebaut…",
  "Trainingsblöcke und Periodisierung werden strukturiert…",
  "Gleich geschafft — dein Plan nimmt Form an.",
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

  useEffect(() => {
    const timer = setInterval(
      () => setMessageIndex((i) => (i + 1) % MESSAGES.length),
      8000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="theme-dark flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-10">
        <Zap className="h-14 w-14 text-primary animate-pulse drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
      </div>

      <p className="mx-auto max-w-md text-lg font-medium tracking-tight text-foreground/90 transition-opacity duration-700">
        {MESSAGES[messageIndex]}
      </p>

      <div className="mt-12 h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-indeterminate rounded-full bg-primary/80" />
      </div>
    </div>
  );
}
