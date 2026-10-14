import { ArrowUpRight } from "lucide-react";
import { eventSubmissionUrl } from "@/lib/event-types";
const councils = [
  ["Boroondara", "https://www.boroondara.vic.gov.au/events"],
  ["Whitehorse", "https://www.whitehorse.vic.gov.au/whats-on-whitehorse"],
  ["Manningham", "https://www.manningham.vic.gov.au/events"],
  ["Maroondah", "https://www.maroondah.vic.gov.au/Explore/Things-to-see-and-do-in-Maroondah/Events-calendar"],
];
export function CalendarSources() {
  return <section id="calendar-sources" className="calendar-sources"><div><span className="eyebrow">Across Melbourne’s east</span><h2>More happening near you.</h2><p>The calendar brings together Eastsider’s published listings and selected events checked against council and organiser pages. It is a growing community diary, so there will be other events to discover locally.</p><div className="calendar-councils">{councils.map(([name, url]) => <a href={url} key={name}>{name} events <ArrowUpRight size={16}/></a>)}</div><a className="text-link" href="https://www.eastsidernews.org.au/events/">Eastsider’s original calendar <ArrowUpRight size={16}/></a></div><div className="calendar-source-note"><h3>How the diary stays current</h3><p>Eastsider listings refresh from the existing calendar. Additional council and organiser listings are checked individually, with the source and checked date shown on each event.</p><p>Always confirm opening hours, bookings and accessibility with the organiser. A calendar entry is not a booking.</p><a className="text-link" href={eventSubmissionUrl}>Send an event or correction <ArrowUpRight size={15}/></a></div></section>;
}
