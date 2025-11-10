import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Filter, Plus, Download, Repeat, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { RecurringPostDialog } from "@/components/RecurringPostDialog";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { downloadICalendar, printCalendarAsPDF } from "@/lib/calendarExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [timezone, setTimezone] = useState<string>("UTC");
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    loadEvents();
    loadTimezone();
  }, []);

  const loadTimezone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.timezone) {
        setTimezone(profile.timezone);
      }
    } catch (error) {
      console.error("Error loading timezone:", error);
    }
  };

  const saveTimezone = async (newTimezone: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ timezone: newTimezone })
        .eq("id", user.id);

      if (error) throw error;
      setTimezone(newTimezone);
      toast.success(t("calendar.timezone.updated"));
    } catch (error) {
      console.error("Error saving timezone:", error);
      toast.error(t("calendar.timezone.updateFailed"));
    }
  };

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
    if (bulkSelectMode) return;
    const selectedDate = format(new Date(info.dateStr), "yyyy-MM-dd");
    navigate(`/upload?date=${selectedDate}`);
  };

  const handleEventClick = (info: any) => {
    if (bulkSelectMode) {
      const eventId = info.event.id;
      setSelectedEventIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
    } else {
      toast.info(t("calendar.clickToEdit"));
    }
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
      await loadEvents();
    } catch (error) {
      console.error("Error rescheduling post:", error);
      toast.error(t("calendar.rescheduleFailed"));
      info.revert();
    }
  };

  const generateRecurringPosts = async (pattern: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the template post data from upload page or create a basic one
      const templatePost = {
        user_id: user.id,
        title: "Recurring Post",
        status: "draft",
        platforms: ["instagram"],
        recurring_pattern: pattern,
      };

      const instances: any[] = [];
      const startDate = new Date();
      let currentDate = startDate;
      let count = 0;
      const maxOccurrences = pattern.occurrences || 10;
      const endDate = pattern.endDate ? new Date(pattern.endDate) : null;

      while (count < maxOccurrences && (!endDate || currentDate <= endDate)) {
        if (pattern.frequency === "daily") {
          currentDate = addDays(currentDate, pattern.interval);
        } else if (pattern.frequency === "weekly") {
          currentDate = addWeeks(currentDate, pattern.interval);
        } else if (pattern.frequency === "monthly") {
          currentDate = addMonths(currentDate, pattern.interval);
        }

        if (endDate && currentDate > endDate) break;

        instances.push({
          ...templatePost,
          scheduled_at: currentDate.toISOString(),
          is_recurring_instance: true,
          title: `${templatePost.title} ${count + 1}`,
        });

        count++;
      }

      const { error } = await supabase.from("reels").insert(instances);

      if (error) throw error;

      toast.success(t("calendar.recurring.success", { count: instances.length }));
      await loadEvents();
    } catch (error) {
      console.error("Error creating recurring posts:", error);
      toast.error(t("calendar.recurring.failed"));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("reels")
        .delete()
        .in("id", Array.from(selectedEventIds))
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t("calendar.bulk.deleteSuccess", { count: selectedEventIds.size }));
      setSelectedEventIds(new Set());
      setBulkSelectMode(false);
      setDeleteDialogOpen(false);
      await loadEvents();
    } catch (error) {
      console.error("Error deleting posts:", error);
      toast.error(t("calendar.bulk.deleteFailed"));
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts, error: fetchError } = await supabase
        .from("reels")
        .select("*")
        .in("id", Array.from(selectedEventIds))
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      const duplicates = posts.map((post) => ({
        ...post,
        id: undefined,
        title: `${post.title} (Copy)`,
        scheduled_at: post.scheduled_at ? addDays(new Date(post.scheduled_at), 1).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from("reels").insert(duplicates);

      if (insertError) throw insertError;

      toast.success(t("calendar.bulk.duplicateSuccess", { count: duplicates.length }));
      setSelectedEventIds(new Set());
      setBulkSelectMode(false);
      await loadEvents();
    } catch (error) {
      console.error("Error duplicating posts:", error);
      toast.error(t("calendar.bulk.duplicateFailed"));
    }
  };

  const handleExportICalendar = () => {
    downloadICalendar(filteredEvents, "reelhub-calendar.ics");
    toast.success(t("calendar.export.icalSuccess"));
  };

  const handleExportPDF = () => {
    printCalendarAsPDF(filteredEvents);
    toast.info(t("calendar.export.pdfInfo"));
  };

  const filteredEvents = events.filter((event) => {
    const platformMatch = filterPlatform === "all" || event.extendedProps.platforms.includes(filterPlatform);
    const statusMatch = filterStatus === "all" || event.extendedProps.status === filterStatus;
    return platformMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("calendar.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("calendar.subtitle")}</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>💡</span>
            <span>{t("calendar.dragToReschedule")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={bulkSelectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBulkSelectMode(!bulkSelectMode);
              if (bulkSelectMode) setSelectedEventIds(new Set());
            }}
            className="gap-2"
          >
            {bulkSelectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {bulkSelectMode ? t("calendar.bulk.exitMode") : t("calendar.bulk.selectMode")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                {t("calendar.export.title")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportICalendar}>
                {t("calendar.export.ical")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                {t("calendar.export.pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setRecurringDialogOpen(true)} className="gap-2">
            <Repeat className="w-4 h-4" />
            {t("calendar.recurring.button")}
          </Button>
          <Button onClick={() => navigate("/upload")} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.createPost")}
          </Button>
        </div>
      </div>

      {/* Filters and Timezone */}
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
          <TimezoneSelector value={timezone} onChange={saveTimezone} className="space-y-2" />
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
                editable={!bulkSelectMode}
                droppable={!bulkSelectMode}
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
                eventClassNames={(arg) => {
                  const classes = ["draggable-event"];
                  if (selectedEventIds.has(arg.event.id)) {
                    classes.push("fc-event-selected");
                  }
                  return classes;
                }}
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

      {/* Bulk Actions Bar */}
      {bulkSelectMode && (
        <BulkActionsBar
          selectedCount={selectedEventIds.size}
          onDelete={() => setDeleteDialogOpen(true)}
          onDuplicate={handleBulkDuplicate}
          onReschedule={() => toast.info(t("calendar.bulk.rescheduleInfo"))}
          onClear={() => {
            setSelectedEventIds(new Set());
            setBulkSelectMode(false);
          }}
        />
      )}

      {/* Recurring Post Dialog */}
      <RecurringPostDialog
        open={recurringDialogOpen}
        onOpenChange={setRecurringDialogOpen}
        onConfirm={generateRecurringPosts}
        timezone={timezone}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.bulk.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("calendar.bulk.deleteWarning", { count: selectedEventIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
