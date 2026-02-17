import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "signup";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 20, label: "Schwach", color: "bg-destructive" };
  if (score <= 2) return { score: 40, label: "Mäßig", color: "bg-yellow-500" };
  if (score <= 3) return { score: 60, label: "Gut", color: "bg-yellow-400" };
  if (score <= 4) return { score: 80, label: "Stark", color: "bg-primary" };
  return { score: 100, label: "Sehr stark", color: "bg-primary" };
}

export default function Auth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !agbAccepted) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte AGB & Datenschutz akzeptieren." });
      return;
    }
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "E-Mail prüfen",
          description: "Wir haben dir einen Bestätigungslink gesendet.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Fehler", description: String(error), variant: "destructive" });
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary"> COACH</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Dein KI-gestützter Trainingspartner</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="bg-card card-shadow rounded-2xl p-6 space-y-6 border border-border">
          {/* Tabs */}
          <div className="flex rounded-xl bg-secondary p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  mode === m
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                required
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl"
              />
              {mode === "signup" && password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agb"
                  checked={agbAccepted}
                  onCheckedChange={(c) => setAgbAccepted(c === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="agb" className="text-xs text-muted-foreground leading-tight">
                  Ich akzeptiere die AGB & Datenschutzbestimmungen
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full text-sm font-bold uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-full"
            >
              {submitting ? "Laden…" : mode === "login" ? "Anmelden" : "Konto erstellen"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="text-center">
              <Link to="/auth/forgot" className="text-xs text-primary hover:underline">
                Passwort vergessen? (Magic Link)
              </Link>
            </div>
          )}

          {/* OAuth */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">oder</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => handleOAuth("google")}
            >
              Mit Google fortfahren
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => handleOAuth("apple")}
            >
              Mit Apple fortfahren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
