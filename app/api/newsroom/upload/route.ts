import { env } from "cloudflare:workers";
import { requireMember, errorResponse, HttpError } from "@/lib/permissions";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireMember(request);
    if(Number(request.headers.get("content-length") || 0) > 5400000) throw new HttpError(413,"Choose an image smaller than 5 MB.");
    const form = await request.formData(), file = form.get("file");
    if(!(file instanceof File) || file.size > 5*1024*1024 || file.size === 0) throw new HttpError(400,"Choose a JPG, PNG or WebP image smaller than 5 MB.");
    const data = await file.arrayBuffer(), bytes = new Uint8Array(data);
    let ext = "", type = "";
    if(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { ext="jpg"; type="image/jpeg"; }
    else if(bytes.slice(0,8).join(",") === "137,80,78,71,13,10,26,10") { ext="png"; type="image/png"; }
    else if(new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") { ext="webp"; type="image/webp"; }
    else throw new HttpError(400,"That file is not a supported image. Choose a JPG, PNG or WebP.");
    if(!env.BUCKET) throw new HttpError(503,"Image storage is temporarily unavailable.");
    const key = crypto.randomUUID()+"."+ext;
    await env.BUCKET.put(key,data,{ httpMetadata:{contentType:type} });
    return Response.json({url:"/media/"+key});
  } catch(e){return errorResponse(e);}
}
