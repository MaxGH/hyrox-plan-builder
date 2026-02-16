import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export default function GeneratingPlan() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!user) return;

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
          if (payload.new.status === "ready") {
            navigate("/plan");
          }
        }
      )
      .subscribe();

    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleRetry = useCallback(async () => {
    if (!user) return;
    setRetrying(true);
    await supabase.from("training_plans").delete().eq("user_id", user.id);
    navigate("/onboarding");
  }, [user, navigate]);

  if (timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <Zap className="mb-6 h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-black uppercase tracking-wider text-foreground">
          Das hat länger gedauert als erwartet.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Etwas ist schiefgelaufen. Bitte versuche es erneut.
        </p>
        <Button
          onClick={handleRetry}
          disabled={retrying}
          className="mt-8 px-8 py-6 text-lg font-bold uppercase tracking-wider"
        >
          {retrying ? "Wird gelöscht…" : "Erneut versuchen"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Pulsing icon */}
      <div className="mb-8 animate-pulse">
        <Zap className="h-20 w-20 text-primary drop-shadow-[0_0_24px_hsl(var(--primary)/0.6)]" />
      </div>

      <h1 className="text-3xl font-black uppercase tracking-wider text-foreground">
        Dein Plan wird erstellt
      </h1>

      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Unser AI Coach analysiert deine Daten und baut deinen persönlichen
        Trainingsplan. Das dauert ca. 30–60 Sekunden.
      </p>

      {/* Indeterminate progress bar */}
      <div className="mt-10 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-indeterminate rounded-full bg-primary" />
      </div>
    </div>
  );
}
