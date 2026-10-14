import { ArrowLeft, ArrowUpRight, CalendarPlus, Clock3, ExternalLink, MapPin, Ticket } from "lucide-react";
import { Breadcrumb } from "./editorial";
import { JsonLd } from "./article";
import { dayLabel, eventDates, eventPath, eventSubmissionUrl, eventTime, hasFreeEntry, localDate } from "@/lib/event-types";
import type { CommunityEvent } from "@/lib/event-types";
import { siteOrigin } from "@/lib/content";

export function eventStructuredData(event: CommunityEvent) {
  return { "@context": "https://schema.org", "@type": "Event", name: event.title, startDate: event.start, ...(event.end ? { endDate: event.end } : {}), url: siteOrigin() + eventPath(event), sameAs: event.sourceUrl,
    ...(event.description ? { description: event.description } : {}),
    ...(event.availability === "Cancelled" ? { eventStatus: "https://schema.org/EventCancelled" } : event.availability === "Postponed" ? { eventStatus: "https://schema.org/EventPostponed" } : {}),
    ...(event.online ? { eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", location: { "@type": "VirtualLocation", url: event.sourceUrl } } : event.venue ? { eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", location: { "@type": "Place", name: event.venue, address: { "@type": "PostalAddress", streetAddress: event.address, addressLocality: event.suburb, addressRegion: "VIC", addressCountry: "AU" } } } : {}),
    ...(event.organiser ? { organizer: { "@type": "Organization", name: event.organiser } } : {}),
    ...(hasFreeEntry(event) ? { isAccessibleForFree: true } : {}) };
}
export function EventDetail({ event }: { event: CommunityEvent }) {
  const calendarUrl="/events?month="+localDate(event.start).slice(0,7);
  return <main id="main" className="wrap content-page"><Breadcrumb items={[{ label: "Community calendar", href: calendarUrl }, { label: event.title }]}/><JsonLd data={eventStructuredData(event)}/>
    <article className="event-detail"><div className="event-detail-copy"><div className="story-kicker"><span>{event.category}</span><span>{event.area}</span></div><h1>{event.title}</h1>{event.availability && <p className="event-availability">{event.availability}</p>}<p className="event-detail-date">{eventDates(event)}</p>{event.description && <p className="event-detail-description">{event.description}</p>}
      <div className="event-facts"><div><Clock3 size={20}/><section><h2>When</h2><p>{eventTime(event)}</p><span>Melbourne local time</span>{event.allDay && <p className="fine-print">Check the source listing for daily opening hours.</p>}</section></div><div><MapPin size={20}/><section><h2>Where</h2><p>{event.venue || "See the source listing"}</p>{event.address && <span>{event.address}{event.suburb && !event.address.toLowerCase().includes(event.suburb.toLowerCase()) ? ", " + event.suburb : ""}</span>}{event.address && !event.online && <a className="text-link" href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([event.venue, event.address, event.suburb, "Victoria Australia"].join(", "))}>Open map <ArrowUpRight size={14}/></a>}</section></div><div><Ticket size={20}/><section><h2>Cost and bookings</h2><p>{event.cost || "Confirm with the organiser"}</p><span>Booking requirements are in the source listing.</span></section></div></div>
      {event.organiser && <p className="event-organiser">Organised by <strong>{event.organiser}</strong>.</p>}<div className="event-detail-actions"><a className="button" href={event.sourceUrl}>Details and booking <ArrowUpRight size={17}/></a><a className="button outline" href={"/api/events/ics/" + event.slug} download><CalendarPlus size={17}/>Add to calendar</a></div>
      <div className="event-provenance"><ExternalLink size={17}/><div><b>Listed by {event.source}</b><p>Source checked {dayLabel(localDate(event.checkedAt), true)}. Confirm times, access and availability with the organiser before attending.</p><a href={event.sourceUrl}>Read the original listing <ArrowUpRight size={13}/></a></div></div><a className="text-link" href={calendarUrl}><ArrowLeft size={16}/>Back to the community calendar</a>
    </div><aside className="event-detail-aside"><span className="eyebrow">Community noticeboard</span><h2>Something happening near you?</h2><p>Send us your event’s date, venue, cost and booking link. Community listings are reviewed before they appear.</p><a className="text-link" href={eventSubmissionUrl}>Submit an event <ArrowUpRight size={16}/></a></aside></article>
  </main>;
}
