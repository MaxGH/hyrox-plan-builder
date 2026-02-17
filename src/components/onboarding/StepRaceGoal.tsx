import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import type { StepProps } from "./types";

interface HyroxEvent {
  id: string;
  name: string;
  race_date: string;
}

export default function StepRaceGoal({ data, updateData, errors }: StepProps) {
  const [events, setEvents] = useState<HyroxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"dropdown" | "manual">("dropdown");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("hyrox_events")
      .select("*")
      .gte("race_date", new Date().toISOString().split("T")[0])
      .order("race_date", { ascending: true })
      .then(({ data: rows, error }) => {
        if (!error && rows && rows.length > 0) {
          setEvents(rows as HyroxEvent[]);
        } else {
          setMode("manual");
        }
        setLoading(false);
      });
  }, []);

  const formatDateDE = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  const selectedLabel = useMemo(() => {
    if (!data.raceName || !data.raceDate) return null;
    return `${data.raceName} — ${format(data.raceDate, "dd.MM.yyyy")}`;
  }, [data.raceName, data.raceDate]);

  const selectEvent = (ev: HyroxEvent) => {
    updateData({
      raceName: ev.name,
      raceDate: new Date(ev.race_date + "T00:00:00"),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Race selection */}
      {mode === "dropdown" && !loading && events.length > 0 ? (
        <div className="space-y-2">
          <Label>Wähle deinen Wettkampf</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedLabel && "text-muted-foreground"
                )}
              >
                {selectedLabel || "Event auswählen…"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Event suchen…" />
                <CommandList>
                  <CommandEmpty>Kein Event gefunden.</CommandEmpty>
                  <CommandGroup>
                    {events.map((ev) => (
                      <CommandItem
                        key={ev.id}
                        value={`${ev.name} ${ev.race_date}`}
                        onSelect={() => selectEvent(ev)}
                      >
                        {ev.name} — {formatDateDE(ev.race_date)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.raceName && <p className="text-sm text-destructive">{errors.raceName}</p>}
          {errors.raceDate && <p className="text-sm text-destructive">{errors.raceDate}</p>}

          <button
            type="button"
            className="text-xs text-muted-foreground underline mt-1"
            onClick={() => setMode("manual")}
          >
            Mein Event ist nicht dabei → Manuell eingeben
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="raceName">Race Name</Label>
            <Input
              id="raceName"
              placeholder="e.g. HYROX Berlin 2025"
              value={data.raceName}
              onChange={(e) => updateData({ raceName: e.target.value })}
            />
            {errors.raceName && <p className="text-sm text-destructive">{errors.raceName}</p>}
          </div>

          <div className="space-y-2">
            <Label>Race Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.raceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.raceDate ? format(data.raceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.raceDate}
                  onSelect={(d) => updateData({ raceDate: d })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.raceDate && <p className="text-sm text-destructive">{errors.raceDate}</p>}
          </div>

          {events.length > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setMode("dropdown")}
            >
              Aus Kalender wählen
            </button>
          )}
        </>
      )}

      {/* Race name/date stay editable after auto-fill in dropdown mode */}
      {mode === "dropdown" && selectedLabel && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="raceName">Race Name (bearbeitbar)</Label>
            <Input
              id="raceName"
              value={data.raceName}
              onChange={(e) => updateData({ raceName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Race Date (bearbeitbar)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.raceDate ? format(data.raceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.raceDate}
                  onSelect={(d) => updateData({ raceDate: d })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Start date — unchanged */}
      <div className="space-y-2">
        <Label>When do you want to start training?</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.startDate ? format(data.startDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.startDate}
              onSelect={(d) => updateData({ startDate: d })}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
      </div>

      {/* Goal time — unchanged */}
      <div className="space-y-2">
        <Label htmlFor="goalTime">Goal Time (hh:mm:ss)</Label>
        <Input
          id="goalTime"
          placeholder="e.g. 01:15:00"
          value={data.goalTime}
          onChange={(e) => updateData({ goalTime: e.target.value })}
        />
        {errors.goalTime && <p className="text-sm text-destructive">{errors.goalTime}</p>}
      </div>
    </div>
  );
}
