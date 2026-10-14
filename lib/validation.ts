import { z } from "zod";
import { categories } from "./types";
export const storySchema = z.object({
  id: z.string().max(100).optional(), revision: z.number().int().min(0).default(0),
  action: z.enum(["draft", "review", "publish", "unpublish"]).default("draft"),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180), summary: z.string().trim().max(320),
  body: z.array(z.object({ type: z.enum(["paragraph", "heading", "quote", "list"]), text: z.string().max(15000) })).max(150),
  coauthors: z.array(z.string().trim().min(2).max(100)).max(8).default([]),
  authorSlug: z.string().max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).or(z.literal("")).optional(),
  kind: z.enum(["Report", "Opinion", "Community contribution"]).default("Report"),
  correction: z.string().trim().max(1600).default(""),
  author: z.string().trim().min(1).max(100), category: z.string().refine(v => categories.includes(v)), suburb: z.string().max(100),
  image: z.string().max(2000).refine(v => !v || /^\/(images|media)\/[a-zA-Z0-9._-]+$/.test(v)),
  imageAlt: z.string().max(300), imageCredit: z.string().max(200),
  sourceUrl: z.string().max(2000).refine(v => !v || /^https:\/\//.test(v) && (() => { try { return new URL(v).protocol === "https:"; } catch { return false; } })()),
  isSummary: z.boolean().default(false), featured: z.boolean().default(false),
});

export const contributorSchema = z.object({
  id: z.string().max(100).optional(), revision: z.number().int().min(0).default(0),
  action: z.enum(["draft", "review", "publish", "unpublish"]).default("draft"),
  name: z.string().trim().min(2).max(100), slug: z.string().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  bio: z.string().trim().max(2000), location: z.string().trim().max(100),
  image: z.string().max(2000).refine(v => !v || /^\/(images|media)\/[a-zA-Z0-9._-]+$/.test(v)),
  imageAlt: z.string().max(300), imageCredit: z.string().max(200),
  website: z.string().max(2000).refine(v => !v || (() => { try { return new URL(v).protocol === "https:"; } catch { return false; } })()),
  kind: z.enum(["Person", "Organization"]).default("Person"),
});
