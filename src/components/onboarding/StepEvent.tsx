import { StepProps, isValidDate } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export default function StepEvent({ data, updateData, errors }: StepProps) {
  const { event } = data;

  const raceDateObj = isValidDate(event.raceDate) ? parseISO(event.raceDate) : undefined;
  const startDateObj = isValidDate(event.startDate) ? parseISO(event.startDate) : undefined;

  const daysDiff =
    raceDateObj && startDateObj ? differenceInDays(raceDateObj, startDateObj) : null;
  const tooShort = daysDiff !== null && daysDiff < 42;

  const setDate = (field: "raceDate" | "startDate", date: Date | undefined) => {
    updateData({
      event: { ...event, [field]: date ? format(date, "yyyy-MM-dd") : "" },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dein Event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wann und wo findet dein Rennen statt?
        </p>
      </div>

      {/* Race Date */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Renndatum *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !raceDateObj && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {raceDateObj ? format(raceDateObj, "PPP", { locale: de }) : "Datum wählen"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={raceDateObj}
              onSelect={(d) => setDate("raceDate", d)}
              disabled={(d) => d < new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors["event.raceDate"] && (
          <p className="text-xs text-destructive">{errors["event.raceDate"]}</p>
        )}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trainingsstart *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDateObj && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDateObj ? format(startDateObj, "PPP", { locale: de }) : "Datum wählen"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDateObj}
              onSelect={(d) => setDate("startDate", d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors["event.startDate"] && (
          <p className="text-xs text-destructive">{errors["event.startDate"]}</p>
        )}
        {tooShort && (
          <p className="text-xs text-destructive/80">
            ⚠ Planlänge min. 6 Wochen empfohlen (aktuell {daysDiff} Tage).
          </p>
        )}
      </div>

      {/* Race Name */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Rennname (optional)
        </Label>
        <Input
          value={event.raceName}
          onChange={(e) => updateData({ event: { ...event, raceName: e.target.value } })}
          placeholder="HYROX Race"
          className="border-border bg-secondary rounded-xl"
        />
      </div>

      {/* Goal Time */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Zielzeit (optional)
        </Label>
        <Input
          value={event.goalTime}
          onChange={(e) => updateData({ event: { ...event, goalTime: e.target.value } })}
          placeholder="HH:MM:SS, z. B. 01:05:00"
          className="border-border bg-secondary rounded-xl"
        />
        {errors["event.goalTime"] && (
          <p className="text-xs text-destructive">{errors["event.goalTime"]}</p>
        )}
        <p className="text-xs text-muted-foreground">Format HH:MM:SS, z. B. 01:05:00</p>
      </div>
    </div>
  );
}
