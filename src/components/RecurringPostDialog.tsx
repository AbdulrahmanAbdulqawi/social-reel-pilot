import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
  timezone: string;
}

interface RecurringPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pattern: RecurringPattern) => void;
  initialDate?: Date;
  timezone: string;
}

const weekDays = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export function RecurringPostDialog({
  open,
  onOpenChange,
  onConfirm,
  initialDate,
  timezone,
}: RecurringPostDialogProps) {
  const { t } = useTranslation();
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Default to Monday
  const [endType, setEndType] = useState<"date" | "occurrences">("occurrences");
  const [endDate, setEndDate] = useState(
    initialDate ? format(new Date(initialDate.getTime() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") : ""
  );
  const [occurrences, setOccurrences] = useState(10);

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleConfirm = () => {
    const pattern: RecurringPattern = {
      frequency,
      interval,
      daysOfWeek: frequency === "weekly" ? selectedDays : undefined,
      endDate: endType === "date" ? endDate : undefined,
      occurrences: endType === "occurrences" ? occurrences : undefined,
      timezone,
    };
    onConfirm(pattern);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <DialogTitle>{t("calendar.recurring.title")}</DialogTitle>
          </div>
          <DialogDescription>{t("calendar.recurring.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>{t("calendar.recurring.frequency")}</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("calendar.recurring.daily")}</SelectItem>
                <SelectItem value="weekly">{t("calendar.recurring.weekly")}</SelectItem>
                <SelectItem value="monthly">{t("calendar.recurring.monthly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>
              {t("calendar.recurring.every")} ({frequency === "daily" ? t("calendar.recurring.days") : frequency === "weekly" ? t("calendar.recurring.weeks") : t("calendar.recurring.months")})
            </Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Days of week (for weekly) */}
          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label>{t("calendar.recurring.daysOfWeek")}</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                    className="w-12"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div className="space-y-3">
            <Label>{t("calendar.recurring.ends")}</Label>
            <RadioGroup value={endType} onValueChange={(v: any) => setEndType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occurrences" id="occurrences" />
                <Label htmlFor="occurrences" className="cursor-pointer flex items-center gap-2">
                  {t("calendar.recurring.after")}
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={occurrences}
                    onChange={(e) => {
                      setOccurrences(parseInt(e.target.value) || 1);
                      setEndType("occurrences");
                    }}
                    className="w-20 h-8"
                    onClick={() => setEndType("occurrences")}
                  />
                  {t("calendar.recurring.occurrences")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="endDate" />
                <Label htmlFor="endDate" className="cursor-pointer flex items-center gap-2">
                  {t("calendar.recurring.on")}
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setEndType("date");
                    }}
                    className="w-auto h-8"
                    onClick={() => setEndType("date")}
                  />
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={frequency === "weekly" && selectedDays.length === 0}>
            {t("calendar.recurring.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
