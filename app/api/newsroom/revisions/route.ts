import { database } from "@/lib/content";
import { requireMember, errorResponse, HttpError } from "@/lib/permissions";
import { canEdit, canPublish } from "@/lib/types";
import { seedStories } from "@/lib/seed";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const member=await requireMember();const id=new URL(request.url).searchParams.get("id")||"";const story=await database().prepare("SELECT owner_id FROM stories WHERE id=?").bind(id).first<{owner_id:string}>();if(!story){if(seedStories.some(s=>s.id===id)&&canPublish(member.role))return Response.json({revisions:[]},{headers:{"Cache-Control":"private, no-store"}});throw new HttpError(404,"Article not found.");}if(!canEdit(member,story.owner_id))throw new HttpError(403,"You do not have access to this article.");const revisions=(await database().prepare("SELECT id,data,saved_by,saved_at FROM revisions WHERE story_id=? ORDER BY saved_at DESC LIMIT 30").bind(id).all()).results;return Response.json({revisions},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return errorResponse(e);}}
