export type Block = { type: "paragraph" | "heading" | "quote" | "list"; text: string };
export type Story = {
  id: string; slug: string; title: string; summary: string; body: Block[];
  category: string; suburb: string; author: string; image: string; imageAlt: string;
  imageCredit: string; sourceUrl: string; isSummary: boolean; publishedAt: string;
  showCardImage?: boolean;
  modifiedAt: string; featured: boolean; authorSlug?: string; coauthors?: string[]; kind?: "Report" | "Opinion" | "Community contribution"; correction?: string;
};
export type StoryRecord = {
  id: string; slug: string; title: string; data: string; published_data: string | null;
  owner_id: string; status: string; revision: number; updated_at: string;
};
export type EditorialStory = Story & { status: string; revision: number; ownerId: string; isLive: boolean };
export type Role = "owner" | "editor" | "author";
export type Member = { userId: string; email: string; name: string; role: Role };
export const categories = ["Local news", "Environment", "Arts & culture", "Community", "Heritage"];
export const suburbs = ["Balwyn", "Box Hill", "Boroondara", "Hawthorn", "Kew", "Mont Albert", "Surrey Hills", "Whitehorse", "Melbourne's east"];
export function slugify(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function canPublish(role: Role) { return role === "owner" || role === "editor"; }
export function canEdit(member: Member, ownerId: string) { return canPublish(member.role) || ownerId === member.userId; }
export function dateLabel(value: string, long = false) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: long ? "long" : "short", year: "numeric", timeZone: "Australia/Melbourne" }).format(new Date(value)); }
export function readingMinutes(story: Story) { return Math.max(1, Math.ceil(story.body.map(b => b.text).join(" ").split(/\s+/).length / 220)); }

export type Contributor = {
  id: string; slug: string; name: string; bio: string; location: string;
  image: string; imageAlt: string; imageCredit: string; website: string;
  kind: "Person" | "Organization"; updatedAt: string;
};
export type ContributorRecord = {
  id: string; slug: string; data: string; published_data: string | null;
  owner_id: string; status: string; revision: number; updated_at: string;
};
export type EditorialContributor = Contributor & {
  ownerId: string; status: string; revision: number; isLive: boolean;
};
export const storyKinds = ["Report", "Opinion", "Community contribution"] as const;
export const places = ["Boroondara", "Whitehorse", "Balwyn", "Box Hill", "Hawthorn", "Kew", "Surrey Hills", "Mont Albert", "Manningham", "Maroondah"];
export function authorSlug(story: Story) { return story.authorSlug || slugify(story.author); }
export function storyUrl(story: Story) { return story.isSummary && story.sourceUrl ? story.sourceUrl : "/articles/" + story.slug; }
export function isOrganisation(name: string) { return ["Eastsider News", "Eastsider News contributors", "Sustainability Victoria"].includes(name); }
export function belongsToPlace(story: Story, place: string) {
  const members: Record<string, string[]> = {
    Boroondara: ["Boroondara", "Balwyn", "Hawthorn", "Kew", "Camberwell", "Canterbury", "Glen Iris"],
    Whitehorse: ["Whitehorse", "Box Hill", "Mont Albert", "Surrey Hills", "Burwood", "Blackburn", "Nunawading", "Mitcham", "Vermont"],
    Manningham: ["Manningham", "Doncaster", "Templestowe", "Warrandyte"],
    Maroondah: ["Maroondah", "Ringwood", "Croydon"],
  };
  return (members[place] || [place]).some(p => story.suburb.toLowerCase() === p.toLowerCase());
}

export function authorsOf(story: Story) { return [{name:story.author,slug:authorSlug(story)}, ...(story.coauthors || []).map(name=>({name,slug:slugify(name)}))]; }
