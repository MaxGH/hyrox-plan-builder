import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Kalender", icon: CalendarDays },
  { path: "/plan", label: "Plan", icon: ClipboardList },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]")} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
