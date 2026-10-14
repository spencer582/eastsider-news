import type { CommunityEvent } from "./event-types";
import { localDate, shiftMonth } from "./event-types";

const suburbs: Record<string, string[]> = {
  Boroondara: ["balwyn north", "north balwyn", "balwyn", "kew east", "kew", "hawthorn east", "hawthorn", "camberwell", "canterbury", "glen iris", "ashburton", "surrey hills"],
  Whitehorse: ["blackburn north", "blackburn south", "blackburn", "box hill north", "box hill south", "box hill", "burwood east", "burwood", "nunawading", "mitcham", "forest hill", "vermont south", "vermont", "mont albert north", "mont albert"],
  Manningham: ["doncaster east", "doncaster", "donvale", "templestowe lower", "templestowe", "bulleen", "warrandyte south", "warrandyte", "park orchards", "wonga park"],
  Maroondah: ["croydon north", "croydon south", "croydon hills", "croydon", "ringwood east", "ringwood north", "ringwood", "heathmont", "bayswater north", "kilsyth south", "warranwood"],
};
export function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
  return value.replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key: string) => {
    if (key.startsWith("#")) { const point = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1)); return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ""; }
    return entities[key] || match;
  }).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}
export function eventRegion(city: string, address: string) {
  const declaredCity = city.trim().toLowerCase().replace(/,?\s+(?:vic|victoria)(?:\s+\d{4})?$/i, "");
  // A street named after another suburb must not override the actual venue city.
  for (const [area, places] of Object.entries(suburbs)) {
    if (places.includes(declaredCity)) return { area, suburb: city };
  }
  const text = address.trim().toLowerCase();
  for (const [area, places] of Object.entries(suburbs)) {
    const suburb = places.find(place => new RegExp("\\b" + place + "(?:,?\\s+(?:vic|victoria))?(?:\\s+\\d{4})?(?:,?\\s+australia)?$").test(text));
    if (suburb) return { area, suburb: city || suburb.replace(/\b\w/g, c => c.toUpperCase()) };
  }
  return { area: "Other Eastsider listings", suburb: city };
}
function categoryFor(title: string) {
  if (/market|festival|halloween/i.test(title)) return "Markets & festivals";
  if (/history|historical|lecture|heritage/i.test(title)) return "History & talks";
  if (/climate|environment|tree preservation|plant|wildlife|bird/i.test(title)) return "Environment";
  if (/dance|croquet|walk|yoga|wellbeing/i.test(title)) return "Active & wellbeing";
  if (/music|orchestra|chorale|art show|proms|quintet|exhibition|concert/i.test(title)) return "Arts & culture";
  return "Community";
}
function utcDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return "";
  const result = value.replace(" ", "T") + "Z";
  return Number.isFinite(Date.parse(result)) ? result : "";
}
export function normaliseEastsiderEvent(raw: Record<string, any>, checkedAt: string): CommunityEvent | null {
  const title = plainText(raw.title), allDay = raw.all_day === true;
  const start = allDay ? String(raw.start_date || "").slice(0, 10) : utcDate(raw.utc_start_date);
  const end = allDay ? String(raw.end_date || "").slice(0, 10) : utcDate(raw.utc_end_date);
  if (!title || !/^\d{4}-\d{2}-\d{2}/.test(start) || !Number.isFinite(Date.parse(start)) || !/^[a-z0-9-]+$/.test(raw.slug || "")) return null;
  if (typeof raw.url !== "string" || !raw.url.startsWith("https://www.eastsidernews.org.au/event/")) return null;
  if (raw.hide_from_listings || raw.status !== "publish") return null;
  const venue = raw.venue && !Array.isArray(raw.venue) ? raw.venue : {};
  const address = plainText(venue.address), city = plainText(venue.city);
  const online = !venue.venue && /Where:\s*Online/i.test(plainText(raw.description));
  const region = eventRegion(city, address);
  const organisers = Array.isArray(raw.organizer) ? raw.organizer.map((o: any) => plainText(o.organizer)).filter(Boolean).join(" and ") : "";
  return {
    id: "eastsider-" + raw.id, slug: raw.slug, title, start,
    ...(end && end > start ? { end } : {}), allDay,
    venue: online ? "Online" : plainText(venue.venue), address, suburb: region.suburb,
    area: online && /Boroondara/.test(organisers) ? "Boroondara" : region.area,
    category: categoryFor(title), cost: plainText(raw.cost),
    source: "Eastsider News", sourceUrl: raw.url, checkedAt, organiser: organisers,
    ...(online ? { online: true } : {}),
    ...(/cancelled/i.test(title) ? { availability: "Cancelled" as const } : /postponed/i.test(title) ? { availability: "Postponed" as const } : {}),
  };
}
export function feedWindow(now = new Date()) {
  const month = localDate(now).slice(0, 7);
  return { from: shiftMonth(month, -1) + "-01", through: shiftMonth(month, 12) + "-01" };
}
export async function fetchEastsiderEvents(fetcher: typeof fetch = fetch, now = new Date()) {
  const { from, through } = feedWindow(now), checkedAt = now.toISOString();
  const signal = AbortSignal.timeout(20_000);
  const events: CommunityEvent[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const url = new URL("https://www.eastsidernews.org.au/wp-json/tribe/events/v1/events");
    for (const [key, value] of Object.entries({ start_date: from, end_date: through, per_page: "100", page: String(page) })) url.searchParams.set(key, value);
    const response = await fetcher(url, { headers: { Accept: "application/json" }, signal });
    if (!response.ok) throw new Error("Event source unavailable");
    const payload = await response.json() as { events: Record<string, any>[]; total_pages: number };
    if (!Array.isArray(payload.events) || !Number.isInteger(payload.total_pages) || payload.total_pages < 0 || payload.total_pages > 10) throw new Error("Invalid event source");
    pages = Math.max(1, payload.total_pages);
    for (const raw of payload.events) { const event = normaliseEastsiderEvent(raw, checkedAt); if (event) events.push(event); }
  }
  return { events: [...new Map(events.map(e => [e.id, e])).values()], checkedAt, fallback: false, through };
}
