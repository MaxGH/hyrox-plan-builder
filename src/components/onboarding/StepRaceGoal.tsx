import { useEffect, useState, useCallback } from "react";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { StepProps } from "./types";

interface EventRow {
  id: string;
  name: string;
}

interface EventTypeRow {
  id: string;
  category: string;
  event_date: string;
}

export default function StepRaceGoal({ data, updateData, errors }: StepProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [mode, setMode] = useState<"dropdown" | "manual">("dropdown");
  const [dateAutoFilled, setDateAutoFilled] = useState(false);
  const [nameAutoFilled, setNameAutoFilled] = useState(false);
  const [step2Manual, setStep2Manual] = useState(false);

  // Step 1: load events
  useEffect(() => {
    supabase
      .from("events")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data: rows, error }) => {
        if (!error && rows && rows.length > 0) {
          setEvents(rows);
        } else {
          setMode("manual");
        }
        setLoadingEvents(false);
      });
  }, []);

  // Step 2: load event_types when event selected
  useEffect(() => {
    if (!selectedEventId) {
      setEventTypes([]);
      return;
    }
    setLoadingTypes(true);
    setStep2Manual(false);
    (supabase
      .from("event_types")
      .select("id, category, event_date")
      .eq("event_id", selectedEventId)
      .order("event_date", { ascending: true }) as any)
      .then(({ data: rows, error }: { data: EventTypeRow[] | null; error: any }) => {
        if (!error && rows && rows.length > 0) {
          setEventTypes(rows);
        } else {
          setEventTypes([]);
          setStep2Manual(true);
        }
        setLoadingTypes(false);
      });
  }, [selectedEventId]);

  const handleSelectEvent = useCallback(
    (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) return;
      setSelectedEventId(eventId);
      setSelectedEventName(ev.name);
      // Clear previous step 2/3 selections
      updateData({ raceName: ev.name, raceDate: undefined });
      setNameAutoFilled(false);
      setDateAutoFilled(false);
      setEventTypes([]);
    },
    [events, updateData]
  );

  const handleSelectType = useCallback(
    (typeId: string) => {
      const t = eventTypes.find((et) => et.id === typeId);
      if (!t) return;
      const composedName = `${selectedEventName} ${t.category}`;
      const parsedDate = parse(t.event_date, "yyyy-MM-dd", new Date());
      updateData({ raceName: composedName, raceDate: parsedDate });
      setNameAutoFilled(true);
      setDateAutoFilled(true);
    },
    [eventTypes, selectedEventName, updateData]
  );

  const formatEventDate = (dateStr: string) => {
    try {
      const d = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(d, "dd.MM.yyyy");
    } catch {
      return dateStr;
    }
  };

  const switchToManual = () => {
    setMode("manual");
    setSelectedEventId(null);
    setSelectedEventName("");
    setEventTypes([]);
    setNameAutoFilled(false);
    setDateAutoFilled(false);
  };

  const switchToDropdown = () => {
    setMode("dropdown");
    updateData({ raceName: "", raceDate: undefined });
  };

  if (loadingEvents) {
    return <div className="space-y-6 animate-pulse"><div className="h-10 bg-muted rounded" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* === STEP 1: Event selection === */}
      {mode === "dropdown" && events.length > 0 ? (
        <div className="space-y-2">
          <Label>Wettkampf wählen</Label>
          <Select value={selectedEventId ?? ""} onValueChange={handleSelectEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wettkampf wählen..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            className="text-xs text-muted-foreground underline mt-1"
            onClick={switchToManual}
          >
            Nicht dabei? Manuell eingeben
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="raceName">Race Name</Label>
          <Input
            id="raceName"
            placeholder="z.B. HYROX Berlin 2025"
            value={data.raceName}
            onChange={(e) => {
              updateData({ raceName: e.target.value });
              setNameAutoFilled(false);
            }}
          />
          {errors.raceName && <p className="text-sm text-destructive">{errors.raceName}</p>}
          {events.length > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={switchToDropdown}
            >
              Aus Liste wählen
            </button>
          )}
        </div>
      )}

      {/* === STEP 2: Event type selection (only in dropdown mode after Step 1) === */}
      {mode === "dropdown" && selectedEventId && !step2Manual && (
        <div className="space-y-2 animate-in fade-in-50 duration-300">
          <Label>Wettkampftyp wählen</Label>
          {loadingTypes ? (
            <div className="h-10 bg-muted rounded animate-pulse" />
          ) : eventTypes.length > 0 ? (
            <>
              <Select onValueChange={handleSelectType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wettkampftyp wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.id} value={et.id}>
                      {et.category} — {formatEventDate(et.event_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="text-xs text-muted-foreground underline mt-1"
                onClick={() => setStep2Manual(true)}
              >
                Manuell eingeben
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* === Race Name (auto-filled, shown in dropdown mode) === */}
      {mode === "dropdown" && selectedEventId && (
        <div className="space-y-2 animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2">
            <Label htmlFor="raceNameFilled">Race Name</Label>
            {nameAutoFilled && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Check className="h-3 w-3" /> Auto-ausgefüllt
              </Badge>
            )}
          </div>
          <Input
            id="raceNameFilled"
            value={data.raceName}
            onChange={(e) => {
              updateData({ raceName: e.target.value });
              setNameAutoFilled(false);
            }}
          />
          {errors.raceName && <p className="text-sm text-destructive">{errors.raceName}</p>}
        </div>
      )}

      {/* === STEP 3: Race Date (always shown, auto-filled from Step 2) === */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Race Date</Label>
          {dateAutoFilled && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Check className="h-3 w-3" /> Auto-ausgefüllt
            </Badge>
          )}
        </div>
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
              {data.raceDate ? format(data.raceDate, "PPP") : "Datum wählen"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.raceDate}
              onSelect={(d) => {
                updateData({ raceDate: d });
                setDateAutoFilled(false);
              }}
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
