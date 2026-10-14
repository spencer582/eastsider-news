import { getCommunityEvents } from "@/lib/events";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await getCommunityEvents(), { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
