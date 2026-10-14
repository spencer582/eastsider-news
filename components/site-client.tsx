"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, Bookmark, Menu, Search, Share2, X, Plus, Minus } from "lucide-react";
import { Brand } from "./brand";
import type { Story } from "@/lib/types";
import { categories, dateLabel, slugify, storyUrl, authorSlug, authorsOf } from "@/lib/types";

export function Header({date}:{date:string}) {
  const pathname = usePathname();
  const [menu,setMenu] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileNavigation = useRef<HTMLElement>(null);
  const nav = [["Home","/"],["Local news","/news"],["Environment","/topics/environment"],["Arts & culture","/topics/arts-culture"],["Heritage","/topics/heritage"],["Community","/community"],["Calendar","/events"],["Editions","/editions"]];
  useEffect(()=>{setMenu(false);dialog.current?.close();},[pathname]);
  useEffect(()=>{
    if(menu)mobileNavigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function key(e:KeyboardEvent){
      if(e.isComposing)return;
      if(e.key==="Escape"&&menu){e.preventDefault();setMenu(false);menuButton.current?.focus();}
      const target=e.target instanceof Element?e.target:null;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&!target?.closest("input,textarea,select,[contenteditable]")){e.preventDefault();dialog.current?.showModal();}
    }
    function outside(e:PointerEvent){if(menu&&e.target instanceof Node&&!mobileNavigation.current?.contains(e.target)&&!menuButton.current?.contains(e.target))setMenu(false);}
    window.addEventListener("keydown",key);document.addEventListener("pointerdown",outside);
    return()=>{window.removeEventListener("keydown",key);document.removeEventListener("pointerdown",outside);};
  },[menu]);
  const current=(href:string)=>pathname===href?"page" as const:href!=="/"&&pathname.startsWith(href+"/")?"location" as const:undefined;
  return <>
    <div className="utility"><div className="wrap utility-inner"><span>Free. Independent. Community led.</span><div><a href="/about">About Eastsider</a><a href="/contribute">Contribute</a><a href="/newsroom">Author sign in <ArrowUpRight size={13}/></a></div></div></div>
    <header className="masthead wrap"><div className="masthead-date"><span>{date}</span><span>Melbourne’s eastern suburbs</span></div><Brand/><div className="masthead-note"><span>Local voices, since 2020.</span><a href="https://www.eastsidernews.org.au/donations/">Support your local paper <ArrowUpRight size={14}/></a></div><button ref={menuButton} className="icon-button mobile-toggle" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="mobile-navigation" aria-label={menu?"Close menu":"Open menu"}>{menu?<X/>:<Menu/>}</button></header>
    <div className="navigation"><div className="wrap nav-inner"><nav aria-label="Main navigation">{nav.map(([label,href])=><a key={href} href={href} className={["/news","/events","/editions"].includes(href)?"mobile-priority":undefined} aria-current={current(href)}>{label}</a>)}</nav><div className="nav-actions"><a href="/search" className="search-trigger" onClick={e=>{e.preventDefault();dialog.current?.showModal();}} aria-label="Search Eastsider News" aria-keyshortcuts="Control+k Meta+k"><Search size={20}/><span>Search</span></a><a className="button small" href="/subscribe">Subscribe free <ArrowUpRight size={15}/></a></div></div></div>
    <nav ref={mobileNavigation} id="mobile-navigation" className="mobile-navigation" aria-label="All sections" hidden={!menu}>{[...nav,["Contributors","/authors"],["About us","/about"],["Advertise","/advertise"],["Contribute","/contribute"],["Saved stories","/saved"],["Author sign in","/newsroom"]].map(([label,href])=><a key={href} href={href} aria-current={current(href)} onClick={()=>setMenu(false)}>{label}<ArrowUpRight size={16}/></a>)}</nav>
    <dialog ref={dialog} className="search-dialog" aria-labelledby="search-dialog-title" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><div><div className="dialog-top"><span className="eyebrow">Search Eastsider</span><button className="icon-button" aria-label="Close search" onClick={()=>dialog.current?.close()}><X/></button></div><h2 id="search-dialog-title">What would you like to find?</h2><form action="/search" className="search-form"><Search size={22}/><label className="sr-only" htmlFor="site-search">Search stories, people or places</label><input id="site-search" name="q" autoFocus placeholder="A story, a suburb, a contributor" maxLength={150}/><button className="icon-button" aria-label="Search"><ArrowRight/></button></form><p className="muted">Search the stories on this website.</p><div className="search-topics">{["Balwyn","Environment","Heritage","Box Hill"].map(t=><a key={t} href={"/search?q="+encodeURIComponent(t)}>{t}<ArrowUpRight size={13}/></a>)}</div><a className="text-link" href="/editions">Looking for an older edition? <ArrowRight size={16}/></a></div></dialog>
  </>;
}
function savedIds(): string[] { try { const value=JSON.parse(localStorage.getItem("eastsider:saved") || "[]"); return Array.isArray(value) ? value.filter(x=>typeof x==="string") : []; } catch { return []; } }
export function SaveButton({id, text=false}:{id:string;text?:boolean}) {
  const [saved,setSaved]=useState(false),[error,setError]=useState("");
  useEffect(()=>{const update=()=>setSaved(savedIds().includes(id));update();window.addEventListener("eastsider:saved",update);window.addEventListener("storage",update);return ()=>{window.removeEventListener("eastsider:saved",update);window.removeEventListener("storage",update);};},[id]);
  function toggle(){try{let ids=savedIds();ids=saved?ids.filter(x=>x!==id):[...ids,id];localStorage.setItem("eastsider:saved",JSON.stringify(ids));setSaved(!saved);window.dispatchEvent(new Event("eastsider:saved"));setError("");}catch{setError("Your browser could not save this story.");}}
  return <span className="save-wrap"><button className={text?"text-button":"icon-button bookmark-button"} aria-label={saved?"Remove saved story":"Save story for later"} aria-pressed={saved} onClick={toggle}><Bookmark size={17} fill={saved?"currentColor":"none"}/>{text && (saved?"Saved":"Save story")}</button>{error&&<span role="status" className="small-error">{error}</span>}</span>;
}
export function ShareButton(){const [message,setMessage]=useState("");return <span className="share-wrap"><button className="text-button" onClick={async()=>{try{if(navigator.share){await navigator.share({title:document.title,url:location.href});}else{await navigator.clipboard.writeText(location.href);setMessage("Link copied");}}catch(e){if(e instanceof Error && e.name!=="AbortError")setMessage("Copy the page address to share this story.");}}}><Share2 size={16}/>Share</button>{message&&<span role="status" className="share-message">{message}</span>}</span>;}
export function ReadingTools(){
  const [size,setSize]=useState(1),[ready,setReady]=useState(false);
  useEffect(()=>{try{const saved=Number(localStorage.getItem("eastsider:text-size"));if(saved>=1&&saved<=1.5)setSize(saved);}catch{}setReady(true);},[]);
  useEffect(()=>{document.documentElement.style.setProperty("--reading-scale",String(size));if(ready)try{localStorage.setItem("eastsider:text-size",String(size));}catch{}return()=>{document.documentElement.style.removeProperty("--reading-scale");};},[size,ready]);
  return <div className="reading-tools" aria-label="Article text size"><button className="icon-button" aria-label="Decrease article text size" disabled={size<=1} onClick={()=>setSize(Math.max(1,Number((size-.1).toFixed(1))))}><Minus size={14}/><span>A</span></button><button className="icon-button" aria-label="Increase article text size" disabled={size>=1.5} onClick={()=>setSize(Math.min(1.5,Number((size+.1).toFixed(1))))}><Plus size={14}/><span>A</span></button></div>;
}
export function PrintButton(){return <button className="text-button print-button" onClick={()=>window.print()}>Print</button>;}
export function ReadingProgress(){const [percent,setPercent]=useState(0);useEffect(()=>{function update(){const article=document.querySelector(".article-page");if(!article)return;const rect=article.getBoundingClientRect();setPercent(Math.max(0,Math.min(100,-rect.top/Math.max(1,rect.height-innerHeight)*100)));}update();window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);return()=>{window.removeEventListener("scroll",update);window.removeEventListener("resize",update);};},[]);return <div className="reading-progress" aria-hidden="true"><span style={{width:percent+"%"}}/></div>;}
export function StoryCard({story,compact=false}:{story:Story;compact?:boolean}) {
  const thumb=story.image.startsWith("/images/")?story.image.replace(/\.webp$/,"-small.webp"):story.image;
  const href=storyUrl(story);
  return <article className={(compact?"story-card compact":"story-card")+(story.showCardImage===false?" story-card-text":"")}>
    {story.image&&story.showCardImage!==false&&<a className="story-image" href={href} tabIndex={-1} aria-hidden="true"><img src={thumb} onError={e=>{if(e.currentTarget.src.endsWith("-small.webp"))e.currentTarget.src=story.image;}} alt="" width="600" height="400" loading="lazy" decoding="async"/></a>}
    <div className="story-info"><div className="story-kicker"><a href={"/topics/"+slugify(story.category)}>{story.category}</a>{story.kind==="Opinion"&&<span>Opinion</span>}</div>
    <h3><a href={href}>{story.title}</a></h3>{!compact&&<p>{story.summary}</p>}
    {!compact&&<div className="card-byline">{authorsOf(story).map((a,i)=><span key={a.slug}>{i>0&&" and "}<a href={"/authors/"+a.slug}>{a.name}</a></span>)}</div>}
    <div className="story-meta"><span><time dateTime={story.publishedAt}>{dateLabel(story.publishedAt)}</time>{story.isSummary&&<span className="archive-label">Archive <ArrowUpRight size={11}/></span>}</span><SaveButton id={story.id}/></div></div>
  </article>;
}
export function LatestStories({stories}:{stories:Story[]}) {
  const [active,setActive]=useState("All stories");
  const filtered=active==="All stories"?stories:stories.filter(s=>s.category===active);
  return <section className="section wrap" id="latest"><div className="section-heading"><div><span className="eyebrow">People, places and perspectives</span><h2>Across the east</h2></div><a className="text-link" href="/news">All stories <ArrowUpRight size={18}/></a></div><div className="filter-tabs" role="group" aria-label="Filter stories by section">{["All stories",...categories.filter(c=>stories.some(s=>s.category===c))].map(c=><button key={c} aria-pressed={c===active} className={c===active?"active":""} onClick={()=>setActive(c)}>{c}</button>)}</div><div className="story-grid home-story-grid" aria-live="polite">{filtered.map(s=><StoryCard key={s.id} story={s}/>)}</div>{!filtered.length&&<p className="empty-state">No stories match this section. <a href="/news">Browse all stories.</a></p>}</section>;
}
export function SavedStories({stories}:{stories:Story[]}){const [ids,setIds]=useState<string[]|null>(null);useEffect(()=>{const update=()=>setIds(savedIds());update();window.addEventListener("eastsider:saved",update);window.addEventListener("storage",update);return()=>{window.removeEventListener("eastsider:saved",update);window.removeEventListener("storage",update);};},[]);const found=stories.filter(s=>ids?.includes(s.id));if(ids===null)return <p role="status">Loading your saved stories…</p>;return found.length?<div className="story-grid">{found.map(s=><StoryCard key={s.id} story={s}/>)}</div>:<div className="empty-state"><Bookmark size={30}/><h2>Your next good read, kept here.</h2><p>Tap the bookmark beside a story to keep it on this device.</p><a className="button" href="/news">Explore the stories <ArrowRight size={16}/></a></div>;}
