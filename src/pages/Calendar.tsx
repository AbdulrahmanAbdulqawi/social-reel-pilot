import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Filter, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    platforms: string[];
    caption?: string;
  };
}

const platformColors = {
  instagram: { bg: "#E1306C", border: "#C13584", text: "#FFFFFF" },
  tiktok: { bg: "#000000", border: "#69C9D0", text: "#FFFFFF" },
  youtube: { bg: "#FF0000", border: "#CC0000", text: "#FFFFFF" },
  facebook: { bg: "#1877F2", border: "#166FE5", text: "#FFFFFF" },
};

const statusColors = {
  draft: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))" },
  scheduled: { bg: "hsl(var(--primary))", border: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
  posted: { bg: "hsl(var(--chart-2))", border: "hsl(var(--chart-2))", text: "hsl(var(--primary-foreground))" },
  failed: { bg: "hsl(var(--destructive))", border: "hsl(var(--destructive))", text: "hsl(var(--destructive-foreground))" },
};

export default function Calendar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reels, error } = await supabase
        .from("reels")
        .select("*")
        .eq("user_id", user.id)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (reels || []).map((reel) => {
        const primaryPlatform = reel.platforms?.[0] || "instagram";
        const color = statusColors[reel.status as keyof typeof statusColors] || statusColors.draft;

        return {
          id: reel.id,
          title: reel.title || t("calendar.untitled"),
          start: reel.scheduled_at!,
          backgroundColor: color.bg,
          borderColor: color.border,
          textColor: color.text,
          extendedProps: {
            status: reel.status,
            platforms: reel.platforms || [],
            caption: reel.caption,
          },
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading calendar events:", error);
      toast.error(t("calendar.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info: any) => {
    // Navigate to upload page with pre-filled date
    const selectedDate = format(new Date(info.dateStr), "yyyy-MM-dd");
    navigate(`/upload?date=${selectedDate}`);
  };

  const handleEventClick = (info: any) => {
    // Could open a dialog to view/edit post details
    console.log("Event clicked:", info.event);
    toast.info(t("calendar.clickToEdit"));
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const eventId = info.event.id;
    const newStart = info.event.start;

    if (!newStart) {
      info.revert();
      toast.error(t("calendar.invalidDate"));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        info.revert();
        return;
      }

      // Update the scheduled_at in the database
      const { error } = await supabase
        .from("reels")
        .update({ 
          scheduled_at: newStart.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t("calendar.rescheduleSuccess"));
      
      // Reload events to ensure consistency
      await loadEvents();
    } catch (error) {
      console.error("Error rescheduling post:", error);
      toast.error(t("calendar.rescheduleFailed"));
      info.revert();
    }
  };

  const filteredEvents = events.filter((event) => {
    const platformMatch = filterPlatform === "all" || event.extendedProps.platforms.includes(filterPlatform);
    const statusMatch = filterStatus === "all" || event.extendedProps.status === filterStatus;
    return platformMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("calendar.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("calendar.subtitle")}</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>💡</span>
            <span>{t("calendar.dragToReschedule")}</span>
          </p>
        </div>
        <Button onClick={() => navigate("/upload")} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("dashboard.createPost")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <CardTitle>{t("calendar.filters")}</CardTitle>
          </div>
          <CardDescription>{t("calendar.filterDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("calendar.filterByPlatform")}</label>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.allPlatforms")}</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("calendar.filterByStatus")}</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.allStatuses")}</SelectItem>
                <SelectItem value="draft">{t("dashboard.drafts")}</SelectItem>
                <SelectItem value="scheduled">{t("dashboard.scheduled")}</SelectItem>
                <SelectItem value="posted">{t("dashboard.posted")}</SelectItem>
                <SelectItem value="failed">{t("calendar.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.draft.bg }} />
              <span className="text-sm">{t("dashboard.drafts")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.scheduled.bg }} />
              <span className="text-sm">{t("dashboard.scheduled")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.posted.bg }} />
              <span className="text-sm">{t("dashboard.posted")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.failed.bg }} />
              <span className="text-sm">{t("calendar.failed")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            </div>
          ) : (
            <div className="calendar-wrapper">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                views={{
                  dayGridMonth: {
                    titleFormat: { year: "numeric", month: "long" }
                  },
                  timeGridWeek: {
                    titleFormat: { year: "numeric", month: "short", day: "numeric" },
                    dayHeaderFormat: { weekday: "short", day: "numeric" },
                    slotLabelFormat: {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    }
                  },
                  timeGridDay: {
                    titleFormat: { year: "numeric", month: "long", day: "numeric" },
                    slotLabelFormat: {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    }
                  }
                }}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                slotDuration="01:00:00"
                slotLabelInterval="01:00:00"
                allDaySlot={true}
                nowIndicator={true}
                scrollTime="08:00:00"
                events={filteredEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                editable={true}
                droppable={true}
                height="auto"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }}
                buttonText={{
                  today: t("calendar.today"),
                  month: t("calendar.month"),
                  week: t("calendar.week"),
                  day: t("calendar.day"),
                }}
                eventClassNames="draggable-event"
                dragRevertDuration={300}
                dragScroll={true}
                longPressDelay={250}
                selectMirror={true}
                dayMaxEvents={3}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
