import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

// Common timezones
const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "+00:00" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)", offset: "-05:00" },
  { value: "America/Chicago", label: "Central Time (US & Canada)", offset: "-06:00" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", offset: "-07:00" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", offset: "-08:00" },
  { value: "America/Anchorage", label: "Alaska", offset: "-09:00" },
  { value: "Pacific/Honolulu", label: "Hawaii", offset: "-10:00" },
  { value: "Europe/London", label: "London", offset: "+00:00" },
  { value: "Europe/Paris", label: "Paris, Berlin, Rome", offset: "+01:00" },
  { value: "Europe/Athens", label: "Athens, Istanbul", offset: "+02:00" },
  { value: "Europe/Moscow", label: "Moscow", offset: "+03:00" },
  { value: "Asia/Dubai", label: "Dubai, Abu Dhabi", offset: "+04:00" },
  { value: "Asia/Karachi", label: "Islamabad, Karachi", offset: "+05:00" },
  { value: "Asia/Dhaka", label: "Dhaka", offset: "+06:00" },
  { value: "Asia/Bangkok", label: "Bangkok, Jakarta", offset: "+07:00" },
  { value: "Asia/Shanghai", label: "Beijing, Shanghai, Hong Kong", offset: "+08:00" },
  { value: "Asia/Tokyo", label: "Tokyo, Osaka", offset: "+09:00" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne", offset: "+11:00" },
  { value: "Pacific/Auckland", label: "Auckland, Wellington", offset: "+13:00" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "-03:00" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires", offset: "-03:00" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "-06:00" },
  { value: "Africa/Cairo", label: "Cairo", offset: "+02:00" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: "+02:00" },
  { value: "Asia/Riyadh", label: "Riyadh", offset: "+03:00" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: "+02:00" },
];

export function TimezoneSelector({ value, onChange, className }: TimezoneSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <Label className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4 text-muted-foreground" />
        {t("calendar.timezone.label")}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("calendar.timezone.select")} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {timezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label} (UTC{tz.offset})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
