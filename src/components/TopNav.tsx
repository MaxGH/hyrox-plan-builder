import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Kalender", icon: CalendarDays },
  { path: "/plan", label: "Profil", icon: User },
];

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="hidden md:flex sticky top-0 z-50 h-16 items-center justify-between border-b border-border bg-card px-6">
      <button onClick={() => navigate("/dashboard")} className="text-base font-extrabold uppercase tracking-widest text-foreground">
        HYROX<span className="text-primary"> COACH</span>
      </button>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
