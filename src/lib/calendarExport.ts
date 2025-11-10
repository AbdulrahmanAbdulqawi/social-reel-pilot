import { format } from "date-fns";

interface ExportEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    caption?: string;
    platforms: string[];
    status: string;
  };
}

// Generate iCal format
export function generateICalendar(events: ExportEvent[], calendarName: string = "ReelHub Schedule"): string {
  const now = new Date();
  const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'");

  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReelHub//Content Calendar//EN",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:UTC",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  events.forEach((event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const platforms = event.extendedProps.platforms.join(", ");
    const description = `${event.extendedProps.caption || ""}\n\nPlatforms: ${platforms}\nStatus: ${event.extendedProps.status}`;

    icalContent += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:${event.id}@reelhub.app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:${escapeICalText(event.title)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `STATUS:${event.extendedProps.status === "posted" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  icalContent += "\r\nEND:VCALENDAR";
  return icalContent;
}

// Escape special characters for iCal
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

// Download iCal file
export function downloadICalendar(events: ExportEvent[], filename: string = "reelhub-calendar.ics") {
  const icalContent = generateICalendar(events);
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate simple PDF content (HTML that can be printed as PDF)
export function generatePDFContent(events: ExportEvent[]): string {
  const groupedByDate: Record<string, ExportEvent[]> = {};
  
  events.forEach((event) => {
    const date = format(new Date(event.start), "yyyy-MM-dd");
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(event);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ReelHub Content Calendar</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          border-bottom: 3px solid #6366f1;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        .date-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .date-header {
          background: #f3f4f6;
          padding: 10px 15px;
          border-left: 4px solid #6366f1;
          margin-bottom: 15px;
          font-weight: bold;
          font-size: 16px;
        }
        .event {
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }
        .event-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .event-time {
          color: #6366f1;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .event-details {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          margin-right: 5px;
        }
        .badge-draft { background: #f3f4f6; color: #6b7280; }
        .badge-scheduled { background: #dbeafe; color: #1e40af; }
        .badge-posted { background: #d1fae5; color: #065f46; }
        .badge-failed { background: #fee2e2; color: #991b1b; }
        @media print {
          body { padding: 20px; }
          .date-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>📅 ReelHub Content Calendar</h1>
      <p style="color: #666; margin-bottom: 30px;">Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
  `;

  sortedDates.forEach((date) => {
    const dateEvents = groupedByDate[date];
    htmlContent += `
      <div class="date-section">
        <div class="date-header">${format(new Date(date), "EEEE, MMMM d, yyyy")}</div>
    `;

    dateEvents.forEach((event) => {
      const time = format(new Date(event.start), "h:mm a");
      const platforms = event.extendedProps.platforms.join(", ");
      const status = event.extendedProps.status;

      htmlContent += `
        <div class="event">
          <div class="event-title">${event.title}</div>
          <div class="event-time">⏰ ${time}</div>
          <div class="event-details">
            <span class="badge badge-${status}">${status}</span>
            <br>
            <strong>Platforms:</strong> ${platforms}
            ${event.extendedProps.caption ? `<br><strong>Caption:</strong> ${event.extendedProps.caption.substring(0, 100)}${event.extendedProps.caption.length > 100 ? "..." : ""}` : ""}
          </div>
        </div>
      `;
    });

    htmlContent += `</div>`;
  });

  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
}

// Open PDF print dialog
export function printCalendarAsPDF(events: ExportEvent[]) {
  const htmlContent = generatePDFContent(events);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
