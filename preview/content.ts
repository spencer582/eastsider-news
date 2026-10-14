import { seedStories } from "../lib/seed";
import { repositoryStories } from "../content/articles";
import { repositoryContributors } from "../content/contributors";
import published from "../content/published-export.json";
import type { Story, Contributor } from "../lib/types";
import { publicPath, siteUrl } from "./runtime";
export const siteOrigin = () => siteUrl.replace(/\/$/, "");
export const indexingEnabled = () => false;
export async function getPublicStories(): Promise<Story[]> {
  const map = new Map([...seedStories, ...repositoryStories].map(story => [story.id, story]));
  for (const record of published.stories as Array<{id:string; published:Story|null}>) {
    map.delete(record.id);
    if (record.published) map.set(record.id, record.published);
  }
  return [...map.values()].map(story => ({ ...story, image: publicPath(story.image) })).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
}
export async function getStory(slug: string) { return (await getPublicStories()).find(story => story.slug === slug); }
export async function publicContributors(): Promise<Contributor[]> {
  const map = new Map(repositoryContributors.map(profile => [profile.id, profile]));
  for (const record of published.contributors as Array<{id:string; published:Contributor|null}>) {
    map.delete(record.id);
    if (record.published) map.set(record.id, record.published);
  }
  return [...map.values()].map(profile => ({ ...profile, image: publicPath(profile.image) }));
}
