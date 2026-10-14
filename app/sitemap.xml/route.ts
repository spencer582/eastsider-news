import { getPublicStories, siteOrigin } from "@/lib/content";
import { publicContributors } from "@/lib/contributors";
import { categories, slugify, places, authorsOf, belongsToPlace } from "@/lib/types";
import { xml } from "@/lib/xml";
import { getCommunityEvents } from "@/lib/events";
import { eventPath, upcomingEvent } from "@/lib/event-types";
export const dynamic="force-dynamic";
export async function GET(){
  const stories=await getPublicStories(),profiles=await publicContributors(),base=siteOrigin();
  const events=(await getCommunityEvents()).events.filter(event=>upcomingEvent(event));
  const authors=[...new Set([...stories.flatMap(s=>authorsOf(s).map(a=>a.slug)),...profiles.map(p=>p.slug)])];
  const paths=["","news","editions","community","events","about","authors","contribute","advertise","contact","subscribe","editorial-values",...categories.filter(c=>stories.some(s=>s.category===c)).map(c=>"topics/"+slugify(c)),...authors.map(a=>"authors/"+a),...places.filter(p=>stories.some(s=>belongsToPlace(s,p))).map(p=>"places/"+slugify(p))];
  const body=paths.map(p=>`<url><loc>${xml(base+"/"+p)}</loc></url>`).join("")+stories.filter(s=>!s.isSummary).map(s=>`<url><loc>${xml(base+"/articles/"+s.slug)}</loc><lastmod>${xml(s.modifiedAt)}</lastmod>${s.image?`<image:image><image:loc>${xml(new URL(s.image,base).href)}</image:loc></image:image>`:""}</url>`).join("")+events.map(event=>`<url><loc>${xml(base+eventPath(event))}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-cache"}});
}
