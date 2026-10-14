import { env } from "cloudflare:workers";
import { seedStories } from "./seed";
import { repositoryStories } from "../content/articles";
import type { Story, StoryRecord, EditorialStory, Member } from "./types";
import { canPublish } from "./types";

export function database() { if (!env.DB) throw new Error("The newsroom database is not available."); return env.DB; }
export function siteOrigin() { return (env.PUBLIC_SITE_URL || "https://eastsider-newsroom.spenceralexander94.chatgpt.site").replace(/\/$/, ""); }
export function indexingEnabled() { return env.PUBLIC_INDEXING === "true"; }
export async function getRecords() { return (await database().prepare("SELECT * FROM stories").all<StoryRecord>()).results; }
export async function getPublicStories(): Promise<Story[]> {
  const map = new Map([...seedStories, ...repositoryStories].map(s => [s.id, s]));
  for (const row of await getRecords()) {
    map.delete(row.id);
    if (row.published_data) map.set(row.id, JSON.parse(row.published_data));
  }
  return [...map.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export async function getStory(slug: string) { return (await getPublicStories()).find(s => s.slug === slug); }
export async function editorialStories(member: Member): Promise<EditorialStory[]> {
  const map = new Map<string, EditorialStory>();
  if (canPublish(member.role)) for (const s of [...seedStories, ...repositoryStories]) map.set(s.id, { ...s, status: "published", revision: 0, ownerId: "archive", isLive: true });
  for (const row of await getRecords()) {
    if (!canPublish(member.role) && row.owner_id !== member.userId) continue;
    map.set(row.id, { ...JSON.parse(row.data), status: row.status, revision: row.revision, ownerId: row.owner_id, isLive: !!row.published_data });
  }
  return [...map.values()].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}
