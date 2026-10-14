export const eventAreas = ["Boroondara", "Whitehorse", "Manningham", "Maroondah"] as const;
export const eventCategories = ["Arts & culture", "History & talks", "Markets & festivals", "Environment", "Community", "Active & wellbeing"] as const;
export type CommunityEvent = {
  id: string;
  slug: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  venue: string;
  address: string;
  suburb: string;
  area: string;
  category: string;
  cost: string;
  source: string;
  sourceUrl: string;
  checkedAt: string;
  organiser?: string;
  description?: string;
  online?: boolean;
  availability?: "Booked out" | "Cancelled" | "Postponed";
};
export type EventCollection = {
  events: CommunityEvent[];
  checkedAt: string;
  fallback: boolean;
  refreshing?: boolean;
  through: string;
};
export const melbourneZone = "Australia/Melbourne";
export function localDate(value: string | Date = new Date()): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: melbourneZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
export function dayLabel(day: string, short = false) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: short ? "short" : "long", day: "numeric", month: short ? "short" : "long", year: "numeric" }).format(new Date(day + "T12:00:00Z"));
}
export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(month + "-01T12:00:00Z"));
}
export function shiftMonth(month: string, amount: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + amount, 1)).toISOString().slice(0, 7);
}
export function addDays(day: string, amount: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function eventEndDay(event: CommunityEvent) { return localDate(event.end || event.start); }
export function eventOnDay(event: CommunityEvent, day: string) { return localDate(event.start) <= day && eventEndDay(event) >= day; }
export function upcomingEvent(event: CommunityEvent, now = new Date()) {
  if (event.allDay || !event.end) return eventEndDay(event) >= localDate(now);
  return new Date(event.end).getTime() >= now.getTime();
}
export function eventTime(event: CommunityEvent) {
  if (event.allDay) return "See opening times";
  const format = (value: string) => new Intl.DateTimeFormat("en-AU", { timeZone: melbourneZone, hour: "numeric", minute: "2-digit" }).format(new Date(value)).replace(":00", "");
  const start = format(event.start);
  return event.end && localDate(event.start) === localDate(event.end) ? start + " to " + format(event.end) : start;
}
export function eventDates(event: CommunityEvent) {
  const start = localDate(event.start), end = eventEndDay(event);
  return dayLabel(start, true) + (end !== start ? " to " + dayLabel(end, true) : "");
}
export function calendarDays(month: string) {
  const first = month + "-01", offset = (new Date(first + "T12:00:00Z").getUTCDay() + 6) % 7;
  const last = addDays(shiftMonth(month, 1) + "-01", -1), count = Math.ceil((Number(last.slice(8)) + offset) / 7) * 7;
  return Array.from({ length: count }, (_, i) => addDays(first, i - offset));
}
export function hasFreeEntry(event: CommunityEvent) { return /^(free\b|\$?0(?:\.00)?$)/i.test(event.cost.trim()); }
export function filterEvents(events: CommunityEvent[], filters: { month: string; query?: string; area?: string; category?: string; free?: boolean; day?: string }) {
  const first = filters.month + "-01", next = shiftMonth(filters.month, 1) + "-01";
  const terms = (filters.query || "").toLocaleLowerCase("en-AU").trim().split(/\s+/).filter(Boolean);
  return events.filter(event => localDate(event.start) < next && eventEndDay(event) >= first &&
    (!filters.day || eventOnDay(event, filters.day)) && (!filters.area || event.area === filters.area) &&
    (!filters.category || event.category === filters.category) && (!filters.free || hasFreeEntry(event)) &&
    terms.every(term => [event.title, event.venue, event.address, event.suburb, event.area, event.organiser, event.description].join(" ").toLocaleLowerCase("en-AU").includes(term)))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}
export function eventPath(event: CommunityEvent) { return "/events/" + event.slug; }
export const eventSubmissionUrl = "mailto:eastsidernews1@gmail.com?subject=Community%20event%20listing&body=" + encodeURIComponent("Event name:\nDate and start time:\nFinish time:\nVenue and full address:\nCost and booking link:\nOrganiser and public contact:\nAccessibility information:\nShort description:\nOfficial event link:\n");
