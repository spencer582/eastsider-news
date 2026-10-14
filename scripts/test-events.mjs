import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "eastsider-calendar-"));
try {
  for (const name of ["event-types", "event-feed", "event-ics"]) {
    const source = fs.readFileSync("lib/" + name + ".ts", "utf8").replaceAll('"./event-types"', '"./event-types.mjs"');
    fs.writeFileSync(path.join(tmp, name + ".mjs"), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  }
  const types = await import(pathToFileURL(path.join(tmp, "event-types.mjs")));
  const feed = await import(pathToFileURL(path.join(tmp, "event-feed.mjs")));
  const { eventIcs } = await import(pathToFileURL(path.join(tmp, "event-ics.mjs")));
  let checks = 0;
  const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
  const now = new Date("2026-10-13T09:00:00Z");
  const raw = { id: 10, slug: "test-lecture", title: "A test &#038; discussion", status: "publish", all_day: false, start_date: "2026-10-14 20:00:00", end_date: "2026-10-14 20:00:00", utc_start_date: "2026-10-14 09:00:00", utc_end_date: "2026-10-14 09:00:00", url: "https://www.eastsidernews.org.au/event/test-lecture/", venue: { venue: "Test venue", address: "188 High Street", city: "Kew" }, cost: "", organizer: [{ organizer: "Test society" }] };
  const event = feed.normaliseEastsiderEvent(raw, now.toISOString());
  check(event.title, "A test & discussion", "Publisher HTML entities are decoded");
  check(event.start, "2026-10-14T09:00:00Z", "Feed UTC date is used without inventing an offset");
  check(event.end, undefined, "Identical source end time means no known finish time");
  check(event.area, "Boroondara", "Venue suburb determines local area");
  check(feed.eventRegion("Box Hill", "30 Camberwell Road").area, "Whitehorse", "Street names cannot override the venue suburb");
  check(feed.eventRegion("", "826A High Street, Kew East VIC 3102").area, "Boroondara", "Explicit suburb at the end of an address is recognised");
  check(feed.eventRegion("", "30 Camberwell Road").area, "Other Eastsider listings", "A street name alone is not treated as a suburb");
  check(types.eventTime(event), "8 pm", "Daylight saving displays the source's Melbourne time");
  check(types.localDate("2026-10-16T23:00:00Z"), "2026-10-17", "UTC evening belongs to the next Melbourne date");
  check(types.localDate("2026-04-04T15:30:00Z"), "2026-04-05", "Autumn daylight saving transition retains the correct date");
  check(types.hasFreeEntry(event), false, "Unspecified cost is never presented as free");
  check(types.hasFreeEntry({ ...event, cost: "Free entry. Food at own cost." }), true, "Free admission can include optional paid purchases");
  check(feed.normaliseEastsiderEvent({ ...raw, status: "draft" }, now.toISOString()), null, "Unpublished events are excluded");
  check(feed.normaliseEastsiderEvent({ ...raw, hide_from_listings: true }, now.toISOString()), null, "Publisher's hidden listings remain hidden");
  check(feed.normaliseEastsiderEvent({ ...raw, url: "javascript:alert(1)" }, now.toISOString()), null, "Non-source and unsafe links are rejected");
  check(feed.normaliseEastsiderEvent({ ...raw, utc_start_date: "bad" }, now.toISOString()), null, "Malformed dates are rejected");
  const allDay = feed.normaliseEastsiderEvent({ ...raw, id: 11, slug: "test-show", all_day: true, start_date: "2026-10-29 00:00:00", end_date: "2026-11-01 23:59:59" }, now.toISOString());
  check(allDay.start, "2026-10-29", "Date-only events retain their source date");
  check(types.eventOnDay(allDay, "2026-11-01"), true, "Events span calendar months inclusively");
  check(types.eventOnDay(allDay, "2026-11-02"), false, "Events do not spill past their published closing date");
  check(types.filterEvents([event, allDay], { month: "2026-11" }).length, 1, "Month filters include an ongoing event");
  check(types.filterEvents([event], { month: "2026-10", area: "Whitehorse" }).length, 0, "Area filtering excludes other venues");
  check(types.filterEvents([event], { month: "2026-10", query: "discussion Kew" }).length, 1, "Every search word can match title and location");
  check(types.filterEvents([event], { month: "2026-10", free: true }).length, 0, "Free filter excludes unverified prices");
  check(types.filterEvents([event], { month: "2026-10", day: "2026-10-15" }).length, 0, "Selected day filters the list correctly");
  check(types.shiftMonth("2026-12", 1), "2027-01", "Month controls cross a year boundary");
  const days = types.calendarDays("2026-10");
  check(days[0], "2026-09-28", "Month calendar starts on Monday");
  check(days.at(-1), "2026-11-01", "Month calendar includes the final complete week");
  check(days.length % 7, 0, "Every calendar week has seven days");
  check(types.upcomingEvent({ ...event, end: "2026-10-14T10:00:00Z" }, new Date("2026-10-14T10:01:00Z")), false, "Finished timed events are not shown as forthcoming");
  const ics = eventIcs(allDay, now);
  check(ics.includes("DTEND;VALUE=DATE:20261102\r\n"), true, "iCalendar uses the required exclusive end date");
  check(eventIcs(event, now).includes("DTSTART:20261014T090000Z\r\n"), true, "Calendar downloads preserve exact time in UTC");
  check(eventIcs(event, now).includes("DTEND:"), false, "Downloads do not invent an end time");
  const hostile = eventIcs({ ...event, title: "A title\r\nBEGIN:VALARM", description: "é".repeat(160) }, now);
  check(hostile.split("\r\n").includes("BEGIN:VALARM"), false, "Newlines in source text cannot inject calendar properties");
  check(hostile.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75), true, "Calendar line folding respects UTF-8 octets");
  let calls = 0;
  const fetched = await feed.fetchEastsiderEvents(async url => { calls++; return new Response(JSON.stringify({ total_pages: 2, events: Number(url.searchParams.get("page")) === 1 ? [raw] : [raw, { ...raw, id: 12, slug: "second-event" }] }), { headers: { "Content-Type": "application/json" } }); }, now);
  check(calls, 2, "The feed follows pagination");
  check(fetched.events.length, 2, "Repeated IDs do not duplicate calendar entries");
  check(fetched.fallback, false, "A successful feed is identified as live");
  const empty = await feed.fetchEastsiderEvents(async () => new Response(JSON.stringify({ total_pages: 0, events: [] })), now);
  check(empty.events.length, 0, "An empty live feed stays empty instead of resurrecting removed listings");
  await assert.rejects(() => feed.fetchEastsiderEvents(async () => new Response("Unavailable", { status: 503 }), now)); checks++;
  await assert.rejects(() => feed.fetchEastsiderEvents(async () => new Response(JSON.stringify({ total_pages: -1, events: [] })), now)); checks++;
  const snapshot = JSON.parse(fs.readFileSync("content/eastsider-events.json", "utf8"));
  check(snapshot.events.every(e => Number.isFinite(Date.parse(e.start)) && e.sourceUrl.startsWith("https://www.eastsidernews.org.au/event/") && !!e.checkedAt), true, "Every fallback listing carries a valid date and original source");
  check(new Set(snapshot.events.map(e => e.slug)).size, snapshot.events.length, "Event detail routes are unique");
  // The source can be slow. Rendering must finish before its request resolves.
  const platformPath = path.join(tmp, "platform.mjs");
  fs.writeFileSync(platformPath, "export const tasks=[];export function waitUntil(promise){tasks.push(promise);}");
  fs.writeFileSync(path.join(tmp, "snapshot.mjs"), "export default " + JSON.stringify(snapshot));
  const extrasSource = fs.readFileSync("content/events.ts", "utf8");
  fs.writeFileSync(path.join(tmp, "extras.mjs"), ts.transpileModule(extrasSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  const serviceSource = fs.readFileSync("lib/events.ts", "utf8").replace('"cloudflare:workers"', '"./platform.mjs"').replace('"@/content/eastsider-events.json"', '"./snapshot.mjs"').replace('"@/content/events"', '"./extras.mjs"').replace('"./event-feed"', '"./event-feed.mjs"');
  fs.writeFileSync(path.join(tmp, "service.mjs"), ts.transpileModule(serviceSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  const originalFetch = globalThis.fetch;
  let release, requested = 0;
  globalThis.fetch = async () => { requested++; return new Promise(resolve => { release = resolve; }); };
  try {
    const service = await import(pathToFileURL(path.join(tmp, "service.mjs")));
    const platform = await import(pathToFileURL(platformPath));
    let timeout;
    const first = await Promise.race([service.getCommunityEvents(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("The slow source blocked rendering")), 1000); })]).finally(() => clearTimeout(timeout));
    check(first.refreshing, true, "Initial saved listings state is explicit");
    check(first.events.length >= snapshot.events.length, true, "Saved events are readable before the source responds");
    check(platform.tasks.length, 1, "The source refresh is retained by the Worker lifecycle");
    release(new Response(JSON.stringify({ total_pages: 1, events: [raw] })));
    await Promise.all(platform.tasks);
    const fresh = await service.getCommunityEvents();
    check(fresh.refreshing, false, "Fresh source clears the pending state");
    check(fresh.fallback, false, "Successful refresh is not labelled as an outage");
    check(fresh.events.filter(e => e.source === "Eastsider News").length, 1, "A refresh removes superseded source listings");
    check(requested, 1, "Subsequent requests reuse the successful cache");
  } finally { globalThis.fetch = originalFetch; }
  if (process.argv.includes("--live")) {
    const live = await feed.fetchEastsiderEvents();
    check(live.events.length > 0, true, "The actual Eastsider feed responds with valid listings");
    console.log(`Live source check: ${live.events.length} published listings fetched.`);
  }
  console.log(`${checks} calendar, feed, date and download checks passed.`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
