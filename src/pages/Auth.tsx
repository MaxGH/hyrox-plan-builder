import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/AuthForm";

export default function Auth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold uppercase tracking-widest text-foreground">
          HYROX<span className="text-primary"> COACH</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Dein KI-gestützter Trainingspartner</p>
      </div>
      <AuthForm />
    </div>
  );
}
