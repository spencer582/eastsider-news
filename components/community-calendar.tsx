"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, List, MapPin, Search, X } from "lucide-react";
import { calendarDays, dayLabel, eventAreas, eventCategories, eventEndDay, eventOnDay, eventPath, eventSubmissionUrl, eventTime, filterEvents, hasFreeEntry, localDate, monthLabel, shiftMonth } from "@/lib/event-types";
import type { CommunityEvent, EventCollection } from "@/lib/event-types";

export function EventCard({ event }: { event: CommunityEvent }) {
  const day = localDate(event.start);
  return <article className="calendar-event-card">
    <div className="calendar-card-date"><time dateTime={day}><b>{day.slice(8)}</b><span>{new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(new Date(day + "T12:00:00Z"))}</span></time><span>{event.area}</span></div>
    <div className="calendar-card-body"><div className="calendar-card-kicker"><span>{event.category}</span>{event.availability && <strong>{event.availability}</strong>}{hasFreeEntry(event) && <span className="free-label">Free entry</span>}</div>
      <h3><a href={eventPath(event)}>{event.title}</a></h3>
      <p><Clock3 size={14} aria-hidden="true"/>{eventTime(event)}{eventEndDay(event) !== day && <span>, until {dayLabel(eventEndDay(event), true)}</span>}</p>
      <p><MapPin size={14} aria-hidden="true"/>{[event.venue || "Venue in source listing", event.suburb].filter(Boolean).join(", ")}</p>
      <div className="calendar-card-foot"><span>Source: {event.source}</span><a href={eventPath(event)}>Event details <ArrowRight size={14}/></a></div>
    </div>
  </article>;
}

export function CommunityCalendar({ collection, initialMonth, today }: { collection: EventCollection; initialMonth: string; today: string }) {
  const [data, setData] = useState(collection);
  useEffect(() => {
    if (!collection.refreshing) return;
    let stopped = false, attempts = 0, timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/events", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Calendar refresh unavailable");
        const next = await response.json() as EventCollection;
        if (!Array.isArray(next.events)) throw new Error("Invalid calendar response");
        if (stopped) return;
        setData(next);
        if (next.refreshing && ++attempts < 10) timer = setTimeout(refresh, 3000);
        else if (next.refreshing) setData(current => ({ ...current, refreshing: false, fallback: true }));
      } catch {
        if (!stopped) setData(current => ({ ...current, refreshing: false, fallback: true }));
      }
    }
    timer = setTimeout(refresh, 1500);
    return () => { stopped = true; clearTimeout(timer); controller.abort(); };
  }, [collection.refreshing]);
  const [month, setMonth] = useState(initialMonth), [view, setView] = useState<"month" | "list">("month");
  const [area, setArea] = useState(""), [category, setCategory] = useState(""), [query, setQuery] = useState(""), [free, setFree] = useState(false), [selectedDay, setSelectedDay] = useState("");
  const matching = filterEvents(data.events, { month, area, category, query, free });
  const visible = selectedDay ? matching.filter(event => eventOnDay(event, selectedDay)) : matching.filter(event => month === today.slice(0, 7) ? eventEndDay(event) >= today : true);
  const days = calendarDays(month), activeFilters = !!(area || category || query || free);
  function goMonth(value: string) { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) { setMonth(value); setSelectedDay(""); } }
  function clearFilters() { setArea(""); setCategory(""); setQuery(""); setFree(false); setSelectedDay(""); }
  return <>
    <div className="calendar-intro"><div><span className="eyebrow">Your community diary</span><h1>Make time for local.</h1><p>Find talks, markets, music and community gatherings across Boroondara, Whitehorse, Manningham and Maroondah.</p></div><a className="button" href={eventSubmissionUrl}>Submit an event <ArrowUpRight size={17}/></a></div>
    <div className="calendar-source-status" role="status"><span className={data.fallback ? "source-dot source-offline" : "source-dot"} aria-hidden="true"/><p>{data.fallback ? "Showing the last checked Eastsider listings. Live updates are temporarily unavailable." : data.refreshing ? "Showing the last checked Eastsider listings while the source refreshes." : "Connected to Eastsider’s community calendar, with selected council and organiser listings."}<span> Eastsider listings checked {dayLabel(localDate(data.checkedAt), true)}.</span></p><a href="#calendar-sources">Our sources <ArrowRight size={14}/></a></div>
    <section className="calendar-shell" aria-label="Community events calendar">
      <div className="calendar-filters"><label className="calendar-search"><span className="sr-only">Search events, venues and suburbs</span><Search size={18} aria-hidden="true"/><input type="search" value={query} onChange={e => { setQuery(e.target.value); setSelectedDay(""); }} placeholder="Search events, venues or suburbs" maxLength={120}/></label><label>Area<select value={area} onChange={e => { setArea(e.target.value); setSelectedDay(""); }}><option value="">All areas</option>{eventAreas.map(a => <option key={a}>{a}</option>)}<option>Other Eastsider listings</option></select></label><label>Interest<select value={category} onChange={e => { setCategory(e.target.value); setSelectedDay(""); }}><option value="">All interests</option>{eventCategories.map(c => <option key={c}>{c}</option>)}</select></label><label className="calendar-free"><input type="checkbox" checked={free} onChange={e => { setFree(e.target.checked); setSelectedDay(""); }}/><span>Free entry</span></label></div>
      <div className="calendar-toolbar"><div className="calendar-month-control"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => goMonth(shiftMonth(month, -1))}><ChevronLeft size={20}/></button><label><span className="sr-only">Choose month</span><input type="month" value={month} onChange={e => goMonth(e.target.value)}/></label><button type="button" className="icon-button" aria-label="Next month" onClick={() => goMonth(shiftMonth(month, 1))}><ChevronRight size={20}/></button></div><button type="button" className="calendar-today" onClick={() => { setMonth(today.slice(0, 7)); setSelectedDay(today); }}>Today</button><div className="calendar-view" role="group" aria-label="Calendar view"><button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}><CalendarDays size={16}/>Month</button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16}/>List</button></div></div>
      <div className="calendar-result-line"><p role="status">{matching.length} {matching.length === 1 ? "event" : "events"} in {monthLabel(month)}{area ? ", " + area : ""}</p>{activeFilters && <button type="button" onClick={clearFilters}>Clear filters <X size={14}/></button>}<span>All times are Melbourne local time</span></div>
      {view === "month" && <div className="month-calendar" aria-label={monthLabel(month)}><div className="calendar-weekdays" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map(day => {
        const inMonth = day.startsWith(month), events = inMonth ? matching.filter(e => eventOnDay(e, day)) : [];
        return <div key={day} className={"calendar-day" + (!inMonth ? " outside-month" : "") + (day < today ? " past-day" : "") + (day === selectedDay ? " selected-day" : "") + (day === today ? " is-today" : "")}>
          <button type="button" className="calendar-day-button" disabled={!inMonth} aria-label={dayLabel(day) + ", " + events.length + (events.length === 1 ? " event" : " events")} aria-pressed={day === selectedDay} aria-current={day === today ? "date" : undefined} onClick={() => setSelectedDay(day === selectedDay ? "" : day)}><time dateTime={day}>{Number(day.slice(8))}</time><span className="calendar-mobile-count" aria-hidden="true">{events.length > 0 && <>{events.length}<i/></>}</span></button>
          <div className="calendar-day-events">{events.slice(0, 2).map(event => <a key={event.id} href={eventPath(event)}><span>{event.allDay ? "Opening times vary" : eventTime(event).split(" to ")[0]}</span><b>{event.title}</b>{event.availability && <em>{event.availability}</em>}</a>)}{events.length > 2 && <button type="button" onClick={() => setSelectedDay(day)} aria-label={"Show all " + events.length + " events on " + dayLabel(day)}>+{events.length - 2} more</button>}</div>
        </div>;
      })}</div><p className="calendar-mobile-hint">Choose a date to see its events below.</p></div>}
    </section>
    <section className="calendar-list-section" aria-labelledby="calendar-list-title"><div className="section-heading"><div><span className="eyebrow">In the diary</span><h2 id="calendar-list-title">{selectedDay ? dayLabel(selectedDay, true) : month === today.slice(0, 7) ? "Still to come this month" : monthLabel(month)}</h2></div>{selectedDay && <button type="button" className="text-link" onClick={() => setSelectedDay("")}>Show the month <X size={15}/></button>}</div>
      <p className="sr-only" role="status">{visible.length} event listings shown{selectedDay ? " for " + dayLabel(selectedDay) : ""}.</p>
      {visible.length ? <div className="calendar-events-grid">{visible.map(event => <EventCard key={event.id} event={event}/>)}</div> : <div className="calendar-empty"><CalendarDays size={30}/><h3>No matching events are listed for these dates.</h3><p>{activeFilters ? "Try another area or interest, or clear your filters." : "Choose another date or browse the council calendars below for more local events."}</p><div>{activeFilters && <button type="button" className="button outline" onClick={clearFilters}>Clear filters</button>}<a className="text-link" href="#calendar-sources">Browse local calendars <ArrowRight size={15}/></a></div></div>}
    </section>
  </>;
}
