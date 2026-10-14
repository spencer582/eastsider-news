import source from "../.preview-cache/events.json";
import { communityEvents } from "../content/events";
import type { CommunityEvent, EventCollection } from "../lib/event-types";
export async function getCommunityEvents(): Promise<EventCollection> {
  const entries = new Map((source.events as CommunityEvent[]).map(event => [event.sourceUrl + "|" + event.start, event]));
  for (const event of communityEvents) entries.set(event.sourceUrl + "|" + event.start, event);
  return { ...source, refreshing: false, events: [...entries.values()].sort((a,b) => a.start.localeCompare(b.start)) };
}
