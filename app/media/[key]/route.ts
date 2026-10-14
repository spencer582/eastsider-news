import { env } from "cloudflare:workers";
import { getMember } from "@/lib/permissions";
import { getPublicStories } from "@/lib/content";
import { publicContributors } from "@/lib/contributors";
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}) {
  const {key}=await params;
  if(!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key))return new Response("Not found",{status:404});
  const path="/media/"+key;
  const isPublished=(await getPublicStories()).some(s=>s.image===path)||(await publicContributors()).some(p=>p.image===path);
  if(!isPublished&&!await getMember())return new Response("Not found",{status:404});
  const object=await env.BUCKET?.get(key);
  if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"Content-Type":object.httpMetadata?.contentType||"application/octet-stream","Cache-Control":isPublished?"public, max-age=3600":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
}
