import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
}

export default function StepRaceGoal({ data, updateData, errors }: StepProps) {
  const [events, setEvents] = useState<HyroxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"dropdown" | "manual">("dropdown");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (supabase
      .from("hyrox_events" as any)
      .select("*")
      .order("name", { ascending: true }) as any)
      .then(({ data: rows, error }: { data: HyroxEvent[] | null; error: any }) => {
        if (!error && rows && rows.length > 0) {
          setEvents(rows);
        } else {
          setMode("manual");
        }
        setLoading(false);
      });
  }, []);

  const selectedLabel = useMemo(() => {
    if (!data.raceName) return null;
    return data.raceName;
  }, [data.raceName]);

  const selectEvent = (ev: HyroxEvent) => {
    updateData({ raceName: ev.name });
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
                        value={ev.name}
                        onSelect={() => selectEvent(ev)}
                      >
                        {ev.name}
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

      {/* Race date — always shown as manual picker */}
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
