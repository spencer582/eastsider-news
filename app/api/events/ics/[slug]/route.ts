import { getCommunityEvents } from "@/lib/events";
import { eventIcs } from "@/lib/event-ics";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,250}$/.test(slug)) return new Response("Event not found", { status: 404 });
  const event = (await getCommunityEvents()).events.find(event => event.slug === slug);
  if (!event) return new Response("Event not found", { status: 404 });
  return new Response(eventIcs(event), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.ics"`, "Cache-Control": "private, max-age=300", "X-Robots-Tag": "noindex" } });
}
