import { ArrowRight, ArrowUpRight, HeartHandshake, Leaf, MapPin, Radio } from "lucide-react";
import { getPublicStories } from "@/lib/content";
import { dateLabel, slugify, storyUrl, authorSlug, authorsOf } from "@/lib/types";
import { LatestStories, SaveButton, StoryCard } from "@/components/site-client";
import { EditionFeature, EventsList, Newsletter } from "@/components/editorial";
import { currentEdition } from "@/lib/seed";
import { getCommunityEvents } from "@/lib/events";
export const dynamic = "force-dynamic";
export const metadata = {alternates:{canonical:"/"}};
export default async function Home(){
  const [stories,eventCollection]=await Promise.all([getPublicStories(),getCommunityEvents()]);const originals=stories.filter(s=>!s.isSummary);
  const lead=originals.find(s=>s.featured)||originals[0]||stories.find(s=>s.featured)||stories[0];
  const others=stories.filter(s=>s.id!==lead?.id);
  return <main id="main">
    <div className="wrap home-intro"><div><span className="eyebrow">Boroondara, Whitehorse and beyond</span><h1>News from Melbourne’s east</h1></div><a href="/about"><MapPin size={15}/>From Kew to Croydon</a></div>
    <section className="wrap front-page" aria-label="Selected stories">
      {lead&&<article className="lead-story"><a className="lead-image" href={storyUrl(lead)}><img src={lead.image} alt={lead.imageAlt} width="1000" height="650" fetchPriority="high"/><span className="image-badge">{lead.isSummary?"From the archive":"In focus"}<ArrowUpRight size={14}/></span></a><div className="story-kicker"><a href={"/topics/"+slugify(lead.category)}>{lead.category}</a><span>{lead.suburb}</span></div><h2><a href={storyUrl(lead)}>{lead.title}</a></h2><p className="lead-deck">{lead.summary}</p><div className="lead-meta"><span className="lead-authors">{authorsOf(lead).map((a,i)=><span key={a.slug}>{i>0&&" and "}<a href={"/authors/"+a.slug}>{a.name}</a></span>)}</span><time dateTime={lead.publishedAt}>{dateLabel(lead.publishedAt)}</time><SaveButton id={lead.id}/></div></article>}
      <div className="front-secondary">{others.slice(0,2).map(s=><StoryCard key={s.id} story={s}/>)}</div>
      <aside className="front-rail"><section className="edition-rail"><span className="eyebrow">Your free local newspaper</span><h2>The latest edition</h2><a className="rail-cover" href={currentEdition.url} aria-label={"Read edition "+currentEdition.number+", "+currentEdition.title+", PDF"}><img src={currentEdition.image} alt={"Eastsider News edition "+currentEdition.number+" cover"} width="260" height="367" loading="lazy"/></a><div className="edition-number">EDITION {currentEdition.number} <span>{currentEdition.title.toUpperCase()}</span></div><a className="button" href={currentEdition.url}>Read the edition <ArrowUpRight size={16}/><span className="sr-only">PDF</span></a><a className="text-link" href="/editions">All past editions <ArrowRight size={15}/></a></section><section className="rail-contribute"><span className="eyebrow">A paper made by its people</span><h2>Have a story for us?</h2><p>Local news, photographs, letters and ideas are welcome.</p><a className="text-link" href="/contribute">Contribute to Eastsider <ArrowUpRight size={15}/></a></section></aside>
    </section>
    <nav className="wrap neighbourhood-strip" aria-label="Browse by neighbourhood"><span>Your neighbourhood</span>{["Boroondara","Whitehorse","Balwyn","Box Hill","Hawthorn","Kew","Surrey Hills"].map(s=><a href={"/places/"+slugify(s)} key={s}>{s}<ArrowUpRight size={12}/></a>)}</nav>
    <LatestStories stories={others.slice(2)}/>
    <section className="local-purpose"><div className="wrap purpose-inner"><span className="purpose-symbol" aria-hidden="true">E</span><div><span className="eyebrow">Independent since 2020</span><h2>Written by people who know the neighbourhood.</h2><p>Eastsider is free to read and run by volunteers. It gives local people a place to share news, celebrate achievements and discuss the decisions affecting their community.</p></div><a className="button outline" href="/about">About the newspaper <ArrowUpRight size={17}/></a></div></section>
    <section className="section wrap community-section"><div className="events-panel"><div className="section-heading"><div><span className="eyebrow">In the diary</span><h2>What’s on locally</h2></div><a className="text-link" href="/events">Full calendar <ArrowUpRight size={17}/></a></div><EventsList events={eventCollection.events}/><a className="text-link event-submit" href="/events#calendar-sources">Tell us about your event <ArrowRight size={16}/></a></div><aside className="community-panel"><span className="eyebrow">Get involved</span><h2>There’s a community for you.</h2><p>Find a local group, share an interest or put your skills to use.</p><a href="/community#environment"><Leaf size={19}/>Environment & nature<ArrowUpRight size={17}/></a><a href="/community#volunteering"><HeartHandshake size={19}/>Volunteering & connection<ArrowUpRight size={17}/></a><a href="/community#culture"><Radio size={19}/>Arts, culture & history<ArrowUpRight size={17}/></a><a className="directory-link" href="/community">Browse the directory <ArrowRight size={17}/></a></aside></section>
    <div className="wrap home-edition"><EditionFeature/></div><Newsletter/>
  </main>;
}
