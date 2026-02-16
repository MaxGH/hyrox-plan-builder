import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("training_plans")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        setHasPlan(!!(data && data.length > 0));
        setChecking(false);
      });
  }, [user]);

  if (authLoading || (user && checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (hasPlan) return <Navigate to="/plan" replace />;
  return <Navigate to="/onboarding" replace />;
}
