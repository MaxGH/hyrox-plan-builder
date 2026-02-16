import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Undo2 } from "lucide-react";

export interface SessionLog {
  id: string;
  user_id: string;
  plan_id: string;
  session_id: string;
  scheduled_date: string;
  completed: boolean;
  rpe: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionLogCardProps {
  sessionId: string;
  scheduledDate: string;
  planId: string;
  existingLog: SessionLog | null;
  onLogChange?: (log: SessionLog) => void;
}

const RPE_COLORS: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-muted text-muted-foreground",
  3: "bg-muted text-muted-foreground",
  4: "bg-yellow-900/40 text-yellow-300",
  5: "bg-yellow-900/40 text-yellow-300",
  6: "bg-yellow-900/40 text-yellow-300",
  7: "bg-orange-900/40 text-orange-300",
  8: "bg-orange-900/40 text-orange-300",
  9: "bg-red-900/40 text-red-300",
  10: "bg-red-900/40 text-red-300",
};

export default function SessionLogCard({
  sessionId,
  scheduledDate,
  planId,
  existingLog,
  onLogChange,
}: SessionLogCardProps) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(existingLog?.completed ?? false);
  const [rpe, setRpe] = useState<number | null>(existingLog?.rpe ?? null);
  const [notes, setNotes] = useState(existingLog?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompleted(existingLog?.completed ?? false);
    setRpe(existingLog?.rpe ?? null);
    setNotes(existingLog?.notes ?? "");
  }, [existingLog]);

  const upsertLog = async (data: {
    completed: boolean;
    rpe: number | null;
    notes: string | null;
  }) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      plan_id: planId,
      session_id: sessionId,
      scheduled_date: scheduledDate,
      completed: data.completed,
      rpe: data.rpe,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from("session_logs")
      .upsert(payload, {
        onConflict: "user_id,plan_id,session_id,scheduled_date",
      })
      .select()
      .single();

    setSaving(false);
    if (!error && result) {
      onLogChange?.(result as unknown as SessionLog);
    }
  };

  const handleComplete = async () => {
    setCompleted(true);
    await upsertLog({ completed: true, rpe, notes: notes || null });
  };

  const handleUndo = async () => {
    setCompleted(false);
    setRpe(null);
    setNotes("");
    await upsertLog({ completed: false, rpe: null, notes: null });
  };

  const handleRpeSelect = async (value: number) => {
    const newRpe = rpe === value ? null : value;
    setRpe(newRpe);
    if (completed) {
      await upsertLog({ completed: true, rpe: newRpe, notes: notes || null });
    }
  };

  const handleNotesBlur = async () => {
    if (completed) {
      await upsertLog({ completed: true, rpe, notes: notes || null });
    }
  };

  if (!completed) {
    return (
      <div className="rounded-lg border-2 border-dashed border-muted p-4">
        <Button
          onClick={handleComplete}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-wider font-bold"
          size="lg"
        >
          <Check className="mr-2 h-5 w-5" />
          Als erledigt markieren
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge className="bg-emerald-600 text-white">
          <Check className="mr-1 h-3 w-3" /> Erledigt
        </Badge>
        <button
          onClick={handleUndo}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Undo2 className="h-3 w-3" /> Rückgängig
        </button>
      </div>

      {/* RPE Selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Wie anstrengend war es? (RPE)
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => handleRpeSelect(v)}
              disabled={saving}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                rpe === v
                  ? RPE_COLORS[v]
                  : "bg-card text-muted-foreground hover:bg-secondary border border-border"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 200))}
          onBlur={handleNotesBlur}
          placeholder="Notiz zur Einheit… (optional)"
          className="resize-none text-sm"
          rows={2}
        />
        <p className="text-right text-[10px] text-muted-foreground mt-1">
          {notes.length}/200
        </p>
      </div>
    </div>
  );
}
