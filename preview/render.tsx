import { renderToString } from "react-dom/server";
import { makeDocument, type DocumentInput } from "./document";
import { getPublicStories, publicContributors } from "./content";
import { getCommunityEvents } from "./events";
import { categories, places, slugify, authorsOf } from "../lib/types";
import { eventIcs } from "../lib/event-ics";
import { GET as sitemap } from "../app/sitemap.xml/route";
import { GET as newsSitemap } from "../app/news-sitemap.xml/route";
import { GET as feed } from "../app/feed.xml/route";
export async function routePaths() {
  const stories = await getPublicStories(), profiles = await publicContributors(), events = await getCommunityEvents();
  return [...new Set(["/","/news","/authors","/editions","/community","/events","/about","/contribute","/advertise","/contact","/subscribe","/editorial-values","/privacy","/search","/saved","/newsroom","/404",...categories.map(c=>"/topics/"+slugify(c)),...places.map(p=>"/places/"+slugify(p)),...stories.map(s=>"/articles/"+s.slug),...stories.flatMap(s=>authorsOf(s).map(a=>"/authors/"+a.slug)),...profiles.map(p=>"/authors/"+p.slug),...events.events.map(e=>"/events/"+e.slug)])];
}
export async function render(input: DocumentInput) { return "<!doctype html>" + renderToString(await makeDocument(input)); }
export async function dataFiles() {
  const collection = await getCommunityEvents();
  return [
    {path:"sitemap.xml",content:await (await sitemap()).text()},
    {path:"news-sitemap.xml",content:await (await newsSitemap()).text()},
    {path:"feed.xml",content:await (await feed()).text()},
    {path:"robots.txt",content:"User-agent: *\nAllow: /\n"},
    {path:"events.json",content:JSON.stringify(collection)},
    ...collection.events.map(event=>({path:"calendar/"+event.slug+".ics",content:eventIcs(event)}))
  ];
}
