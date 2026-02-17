import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function AuthForgot() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
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
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Fehler", description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary"> COACH</span>
        </h1>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-card card-shadow rounded-2xl p-6 space-y-6 border border-border">
          <h2 className="text-xl font-bold text-foreground">Passwort zurücksetzen</h2>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wir haben dir einen Magic Link an <strong>{email}</strong> gesendet. Prüfe dein Postfach.
              </p>
              <Link to="/auth/login">
                <Button variant="outline" className="w-full rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  E-Mail
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  required
                  className="border-border bg-secondary rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-sm font-bold uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                {submitting ? "Laden…" : "Magic Link senden"}
              </Button>
              <div className="text-center">
                <Link to="/auth/login" className="text-xs text-primary hover:underline">
                  Zurück zum Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
