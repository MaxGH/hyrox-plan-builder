import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StepProps } from "./types";

export default function StepRaceGoal({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
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
