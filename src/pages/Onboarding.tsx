import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Onboarding() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">
        HYROX<span className="text-primary text-glow"> COACH</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">Onboarding — coming in Milestone 2</p>
      <Button onClick={signOut} variant="outline" className="mt-8 uppercase tracking-wider">
        Log Out
      </Button>
    </div>
  );
}
