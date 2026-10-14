import { database } from "@/lib/content";
import { requireMember, errorResponse, HttpError } from "@/lib/permissions";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() { try { const member = await requireMember(); if(member.role !== "owner") throw new HttpError(403, "Only the owner can manage the team."); return Response.json({ members: (await database().prepare("SELECT email,name,role,user_id IS NOT NULL AS active FROM team ORDER BY name").all()).results }, { headers: { "Cache-Control": "private, no-store" } }); } catch(e){return errorResponse(e);} }
export async function POST(request: Request) {
  try {
    const member = await requireMember(request); if(member.role !== "owner") throw new HttpError(403, "Only the owner can manage the team.");
    let input; try { input = z.object({ email: z.string().email().max(254), name: z.string().trim().min(1).max(100), role: z.enum(["author","editor"]), action: z.enum(["save","remove"]).default("save") }).parse(await request.json()); } catch { throw new HttpError(400, "Enter a valid name, email address and role."); }
    const email = input.email.trim().toLowerCase(); if(email === member.email) throw new HttpError(400, "The owner’s access is managed separately.");
    if(input.action === "remove") await database().prepare("DELETE FROM team WHERE email=?").bind(email).run();
    else await database().prepare("INSERT INTO team (email,name,role,created_at) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,role=excluded.role").bind(email,input.name,input.role,new Date().toISOString()).run();
    return Response.json({ ok:true });
  } catch(e){return errorResponse(e);}
}
