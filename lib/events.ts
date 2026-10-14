import { waitUntil } from "cloudflare:workers";
import snapshot from "@/content/eastsider-events.json";
import { communityEvents } from "@/content/events";
import { fetchEastsiderEvents, feedWindow } from "./event-feed";
import type { EventCollection, CommunityEvent } from "./event-types";

let memory: { value: EventCollection; expires: number } | undefined;
let pending: Promise<void> | undefined;
function withCommunity(source: EventCollection): EventCollection {
  const merged = new Map(source.events.map(event => [event.sourceUrl + "|" + event.start, event]));
  for (const event of communityEvents) merged.set(event.sourceUrl + "|" + event.start, event);
  return { ...source, events: [...merged.values()].sort((a, b) => a.start.localeCompare(b.start)) };
}
function remember(source: EventCollection, milliseconds: number) {
  const value = withCommunity(source);
  memory = { value, expires: Date.now() + milliseconds };
  return value;
}
export async function getCommunityEvents(): Promise<EventCollection> {
  if (memory && (memory.expires > Date.now() || pending)) return memory.value;
  const cache = typeof caches !== "undefined" ? (caches as CacheStorage & { default?: Cache }).default : undefined;
  const key = new Request("https://eastsider-calendar.invalid/source-v2/" + feedWindow().from);
  let source: EventCollection = { events: snapshot.events as CommunityEvent[], checkedAt: snapshot.checkedAt, through: snapshot.through, fallback: false, refreshing: true };
  try {
    const cached = await cache?.match(key);
    if (cached) {
      source = await cached.json() as EventCollection;
      if (Date.now() - Date.parse(source.checkedAt) < 1_800_000) return remember({ ...source, refreshing: false }, 60_000);
    }
  } catch { /* Cache access must not prevent the diary from rendering. */ }
  const current = remember({ ...source, refreshing: true, fallback: false }, 5_000);
  if (!pending) {
    pending = (async () => {
      try {
        const fresh = await fetchEastsiderEvents();
        remember({ ...fresh, refreshing: false }, 1_800_000);
        try {
          await cache?.put(key, new Response(JSON.stringify(fresh), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=604800" } }));
        } catch { /* Keep the fresh in-process copy if the edge cache is unavailable. */ }
      } catch {
        remember({ ...source, fallback: true, refreshing: false }, 60_000);
      }
    })().finally(() => { pending = undefined; });
    waitUntil(pending);
  }
  return current;
}
