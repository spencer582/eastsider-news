import { database, editorialStories } from "@/lib/content";
import { requireMember, errorResponse, HttpError } from "@/lib/permissions";
import { storySchema } from "@/lib/validation";
import { seedStories } from "@/lib/seed";
import { repositoryStories } from "@/content/articles";
import { publicContributors } from "@/lib/contributors";
import { canEdit, canPublish } from "@/lib/types";
import type { Story, StoryRecord } from "@/lib/types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const member = await requireMember(); return Response.json({ stories: await editorialStories(member) }, { headers: { "Cache-Control": "private, no-store" } }); } catch (e) { return errorResponse(e); }
}
export async function POST(request: Request) {
  try {
    const member = await requireMember(request);
    if (Number(request.headers.get("content-length") || 0) > 350000) throw new HttpError(413, "The article is too large to save.");
    const text = await request.text(); if (text.length > 350000) throw new HttpError(413, "The article is too large to save.");
    let input; try { input = storySchema.parse(JSON.parse(text)); } catch { throw new HttpError(400, "Check the title, author, section and article fields before saving."); }
    const id = input.id || crypto.randomUUID();
    const db = database();
    const existing = await db.prepare("SELECT * FROM stories WHERE id = ?").bind(id).first<StoryRecord>();
    const seed = [...seedStories, ...repositoryStories].find(s => s.id === id);
    if (input.id && !existing && !seed) throw new HttpError(404, "This article no longer exists. Copy your text before reloading.");
    if ((existing && !canEdit(member, existing.owner_id)) || (seed && !canPublish(member.role))) throw new HttpError(403, "You do not have permission to edit this article.");
    if ((input.action === "publish" || input.action === "unpublish") && !canPublish(member.role)) throw new HttpError(403, "An editor needs to approve publication.");
    if (input.revision !== (existing?.revision || 0)) throw new HttpError(409, "A newer version was saved. Copy your changes, then reload the article to compare them.");
    if ((existing || seed) && input.slug !== (existing?.slug || seed?.slug)) throw new HttpError(400, "The address of an existing article is kept stable. Create a new article for a different address.");
    const collision = [...seedStories, ...repositoryStories].find(s => s.slug === input.slug && s.id !== id) || await db.prepare("SELECT id FROM stories WHERE slug = ? AND id != ?").bind(input.slug, id).first();
    if (collision) throw new HttpError(409, "That article address is already in use. Please choose a different one.");
    if (input.action === "publish") {
      if (input.summary.length < 30 || !input.isSummary && input.body.map(b => b.text).join(" ").trim().length < 100) throw new HttpError(400, "Add a short summary and article text before publishing.");
      if (input.image && !input.imageAlt.trim()) throw new HttpError(400, "Add a description of the image before publishing.");
      if (input.image && !input.imageCredit.trim()) throw new HttpError(400, "Add the image credit before publishing.");
      if (input.isSummary && !input.sourceUrl) throw new HttpError(400, "Add the original article link for this reading summary.");
    }
    if (input.authorSlug && input.action === "publish") {
      const profile = (await publicContributors()).find(p => p.slug === input.authorSlug);
      if (!profile || profile.name !== input.author) throw new HttpError(400, "Choose a published contributor profile matching this byline.");
    }
    const now = new Date().toISOString();
    const previous: Story | undefined = existing ? JSON.parse(existing.data) : seed;
    const { action, revision, ...fields } = input;
    const story: Story = { ...fields, coauthors: [...new Set(input.coauthors.filter(name=>name!==input.author))], id, publishedAt: previous?.publishedAt || (action === "publish" ? now : ""), modifiedAt: now, featured: canPublish(member.role) ? input.featured : false };
    let live = existing ? existing.published_data : seed ? JSON.stringify(seed) : null;
    if (action === "publish") live = JSON.stringify(story);
    if (action === "unpublish") live = null;
    const status = action === "publish" ? "published" : action === "review" ? "review" : "draft";
    const data = JSON.stringify(story), nextRevision = revision + 1, ownerId = existing?.owner_id || (seed ? "archive" : member.userId);
    const write = existing
      ? db.prepare("UPDATE stories SET title=?, data=?, published_data=?, status=?, revision=?, updated_at=? WHERE id=? AND revision=?").bind(story.title, data, live, status, nextRevision, now, id, revision)
      : db.prepare("INSERT OR IGNORE INTO stories (id,slug,title,data,published_data,owner_id,status,revision,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, story.slug, story.title, data, live, ownerId, status, nextRevision, now);
    const history = db.prepare("INSERT INTO revisions (id,story_id,data,saved_by,saved_at) SELECT ?,id,data,?,? FROM stories WHERE id=? AND revision=? AND data=?").bind(crypto.randomUUID(), member.name, now, id, nextRevision, data);
    const results = await db.batch([write, history]);
    if (!results[0].meta.changes) throw new HttpError(409, "Another save completed first. Copy your changes, then reload to compare versions.");
    return Response.json({ story: { ...story, status, revision: nextRevision, ownerId, isLive: !!live } });
  } catch (e) { return errorResponse(e); }
}
