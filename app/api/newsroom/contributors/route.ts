import { database } from "@/lib/content";
import { editorialContributors, publicContributors } from "@/lib/contributors";
import { requireMember, HttpError, errorResponse } from "@/lib/permissions";
import { contributorSchema } from "@/lib/validation";
import { canEdit, canPublish } from "@/lib/types";
import type { Contributor, ContributorRecord } from "@/lib/types";
import { repositoryContributors } from "@/content/contributors";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const member = await requireMember();
    return Response.json({profiles: await editorialContributors(member), published: await publicContributors()}, {headers:{"Cache-Control":"private, no-store"}});
  } catch (e) { return errorResponse(e); }
}
export async function POST(request: Request) {
  try {
    const member = await requireMember(request);
    const text = await request.text();
    if (text.length > 15000) throw new HttpError(413, "This profile is too long to save.");
    let input;
    try { input = contributorSchema.parse(JSON.parse(text)); }
    catch { throw new HttpError(400, "Check the name, profile address and website link."); }
    const db = database(), id = input.id || crypto.randomUUID();
    const existing = await db.prepare("SELECT * FROM contributors WHERE id = ?").bind(id).first<ContributorRecord>();
    const seed = repositoryContributors.find(p => p.id === id);
    if (input.id && !existing && !seed) throw new HttpError(404, "This profile could not be found.");
    if ((existing && !canEdit(member, existing.owner_id)) || (seed && !canPublish(member.role))) throw new HttpError(403, "You can only edit your own contributor profile.");
    if (!canPublish(member.role)) {
      if (["publish", "unpublish"].includes(input.action)) throw new HttpError(403, "An editor needs to approve this profile.");
      const own = await db.prepare("SELECT id FROM contributors WHERE owner_id = ? AND id != ?").bind(member.userId, id).first();
      if (own) throw new HttpError(400, "Open your existing profile to update your biography.");
    }
    if (input.revision !== (existing?.revision || 0)) throw new HttpError(409, "This profile has a newer saved version. Copy your changes, then reload it.");
    if ((existing || seed) && input.slug !== (existing?.slug || seed?.slug)) throw new HttpError(400, "A saved profile keeps its original address.");
    const collision = repositoryContributors.find(p => p.slug === input.slug && p.id !== id) || await db.prepare("SELECT id FROM contributors WHERE slug = ? AND id != ?").bind(input.slug, id).first();
    if (collision) throw new HttpError(409, "That profile address is already in use.");
    if (input.action === "publish") {
      if (input.bio.length < 30) throw new HttpError(400, "Add the contributor’s approved biography before publishing the profile.");
      if (input.image && (!input.imageAlt.trim() || !input.imageCredit.trim())) throw new HttpError(400, "Add a description and credit for the profile photograph.");
    }
    const {action, revision, ...fields} = input, now = new Date().toISOString();
    const profile: Contributor = {...fields, id, updatedAt: now};
    let published = existing?.published_data || (seed ? JSON.stringify(seed) : null);
    if (action === "publish") published = JSON.stringify(profile);
    if (action === "unpublish") published = null;
    const status = action === "publish" ? "published" : action === "review" ? "review" : "draft";
    const ownerId = existing?.owner_id || (seed ? "repository" : member.userId), next = revision + 1;
    const result = existing
      ? await db.prepare("UPDATE contributors SET data=?, published_data=?, status=?, revision=?, updated_at=? WHERE id=? AND revision=?").bind(JSON.stringify(profile),published,status,next,now,id,revision).run()
      : await db.prepare("INSERT OR IGNORE INTO contributors (id,slug,data,published_data,owner_id,status,revision,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,profile.slug,JSON.stringify(profile),published,ownerId,status,next,now).run();
    if (!result.meta.changes) throw new HttpError(409, "Another save completed first. Copy your changes, then reload the profile.");
    return Response.json({profile:{...profile,ownerId,status,revision:next,isLive:!!published}});
  } catch (e) { return errorResponse(e); }
}
