import { database } from "./content";
import { repositoryContributors } from "../content/contributors";
import type { Contributor, ContributorRecord, EditorialContributor, Member } from "./types";
import { canPublish } from "./types";

export async function getContributorRecords() {
  return (await database().prepare("SELECT * FROM contributors").all<ContributorRecord>()).results;
}
export async function publicContributors(): Promise<Contributor[]> {
  const profiles = new Map(repositoryContributors.map(p => [p.id, p]));
  for (const record of await getContributorRecords()) {
    profiles.delete(record.id);
    if (record.published_data) profiles.set(record.id, JSON.parse(record.published_data));
  }
  return [...profiles.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export async function editorialContributors(member: Member): Promise<EditorialContributor[]> {
  const profiles = new Map<string, EditorialContributor>();
  if (canPublish(member.role)) for (const p of repositoryContributors) profiles.set(p.id, {...p, ownerId: "repository", status: "published", revision: 0, isLive: true});
  for (const r of await getContributorRecords()) {
    if (!canPublish(member.role) && r.owner_id !== member.userId) continue;
    profiles.set(r.id, {...JSON.parse(r.data), ownerId: r.owner_id, status: r.status, revision: r.revision, isLive: !!r.published_data});
  }
  return [...profiles.values()].sort((a, b) => a.name.localeCompare(b.name));
}
