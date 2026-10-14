import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "./content";
import type { Member, Role } from "./types";

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function getMember(): Promise<Member | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const email = user.email.trim().toLowerCase();
  if (env.NEWSROOM_OWNER_EMAIL && email === env.NEWSROOM_OWNER_EMAIL.toLowerCase()) return { userId: user.userId, email, name: user.fullName || "Spencer Alexander", role: "owner" };
  const member = await database().prepare("SELECT * FROM team WHERE user_id = ? OR (user_id IS NULL AND email = ?)").bind(user.userId, email).first<{ user_id: string | null; email: string; name: string; role: Role }>();
  if (!member) return null;
  if (!member.user_id) {
    const result = await database().prepare("UPDATE team SET user_id = ? WHERE email = ? AND user_id IS NULL").bind(user.userId, member.email).run();
    if (!result.meta.changes) return null;
  }
  return { userId: user.userId, email: member.email, name: member.name, role: member.role };
}
export async function requireMember(request?: Request) {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = (env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    if (!origin || origin !== expected) throw new HttpError(403, "Please open the newsroom on its own website and try again.");
  }
  const member = await getMember();
  if (!member) throw new HttpError(403, "Sign in with an account that has newsroom access.");
  return member;
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Newsroom request failed", error instanceof Error ? error.message : "Unknown error");
  return Response.json({ error: "This could not be saved. Your changes are still on screen. Please try again." }, { status: 500 });
}
