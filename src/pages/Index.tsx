import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from("training_plans")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .then(({ data }) => setHasPlan(!!(data && data.length > 0))),
      supabase
        .from("profiles" as any)
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => setOnboardingComplete(data?.onboarding_complete ?? false)),
    ]).then(() => setChecking(false));
  }, [user]);

  if (authLoading || (user && checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (hasPlan) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/onboarding" replace />;
}
