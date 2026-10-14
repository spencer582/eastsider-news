import type { CommunityEvent } from "./event-types";
import { addDays, localDate } from "./event-types";

const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
const utc = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
function fold(line: string) {
  const encoder = new TextEncoder();
  let part = "", length = 0;
  const lines: string[] = [];
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) { lines.push(part); part = " "; length = 1; }
    part += character; length += bytes;
  }
  lines.push(part);
  return lines.join("\r\n");
}
export function eventIcs(event: CommunityEvent, now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eastsider News//Community Calendar//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + event.id + "@eastsidernews.org.au", "DTSTAMP:" + utc(now.toISOString()),
    "SUMMARY:" + escape(event.title), "URL:" + escape(event.sourceUrl),
    "DESCRIPTION:" + escape([event.description, event.cost ? "Cost: " + event.cost : "Confirm cost and bookings with the organiser.", "Source: " + event.sourceUrl, "Check the source for changes before attending."].filter(Boolean).join("\n")),
    "LOCATION:" + escape([event.venue, event.address, event.suburb].filter(Boolean).join(", "))];
  if (event.allDay) {
    lines.push("DTSTART;VALUE=DATE:" + localDate(event.start).replace(/-/g, ""));
    lines.push("DTEND;VALUE=DATE:" + addDays(localDate(event.end || event.start), 1).replace(/-/g, ""));
  } else {
    lines.push("DTSTART:" + utc(event.start));
    if (event.end) lines.push("DTEND:" + utc(event.end));
  }
  if (event.availability === "Cancelled") lines.push("STATUS:CANCELLED");
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
