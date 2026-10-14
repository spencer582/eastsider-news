import { ArrowUpRight } from "lucide-react";
import type { Contributor, Story } from "@/lib/types";
import { authorsOf, isOrganisation } from "@/lib/types";
import { siteOrigin } from "@/lib/content";
import { Breadcrumb } from "./editorial";
import { StoryCard } from "./site-client";
import { JsonLd } from "./article";
export function ContributorPage({slug,name,profile,stories}:{slug:string;name:string;profile?:Contributor;stories:Story[]}) {
  const url=siteOrigin()+"/authors/"+slug;
  const entity={"@type":profile?.kind||(isOrganisation(name)?"Organization":"Person"),"@id":url+"#author",name,url,description:profile?.bio||undefined,image:profile?.image?new URL(profile.image,siteOrigin()).href:undefined,sameAs:profile?.website?[profile.website]:undefined};
  return <main id="main" className="wrap content-page"><Breadcrumb items={[{label:"Contributors",href:"/authors"},{label:name}]}/><header className="profile-header">{profile?.image?<img className="profile-photo" src={profile.image} alt={profile.imageAlt} width="150" height="150"/>:<span className="profile-initial" aria-hidden="true">{name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>}<div><span className="eyebrow">Eastsider contributor</span><h1>{name}</h1>{profile?.location&&<span className="profile-location">{profile.location}</span>}{profile?.bio?<p>{profile.bio}</p>:<p>Contributions published by Eastsider News.</p>}<div className="profile-links">{profile?.website&&<a href={profile.website} rel="me">Contributor website <ArrowUpRight size={14}/></a>}<a href="#contributions">{stories.length} {stories.length===1?"contribution":"contributions"}</a></div></div></header><div className="section-heading" id="contributions"><h2>Published contributions</h2></div>{stories.length?<div className="story-grid">{stories.map(s=><StoryCard key={s.id} story={s}/>)}</div>:<p className="empty-state">This contributor’s articles will appear here when they are published.</p>}<JsonLd data={{"@context":"https://schema.org","@type":"ProfilePage",url,mainEntity:entity,...(profile?{dateModified:profile.updatedAt}:{}),hasPart:stories.filter(s=>!s.isSummary).map(s=>({"@type":"Article",headline:s.title,url:siteOrigin()+"/articles/"+s.slug,author:{"@id":url+"#author"}}))}}/></main>;
}
export function ContributorsGrid({stories,profiles}:{stories:Story[];profiles:Contributor[]}) {
  const names=new Map(stories.flatMap(s=>authorsOf(s)).map(a=>[a.slug,a.name]));
  for(const p of profiles)names.set(p.slug,p.name);
  return <div className="contributors-grid">{[...names.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([slug,name])=>{const p=profiles.find(p=>p.slug===slug);return <article className="contributor-card" key={slug}>{p?.image?<img src={p.image} alt={p.imageAlt} loading="lazy" width="75" height="75"/>:<span className="profile-initial" aria-hidden="true">{name.split(" ").slice(0,2).map(n=>n[0]).join("")}</span>}<h2><a href={"/authors/"+slug}>{name}</a></h2>{p?.bio&&<p>{p.bio.length>200?p.bio.slice(0,197)+"…":p.bio}</p>}<a className="text-link" href={"/authors/"+slug}>View contributions <ArrowUpRight size={16}/></a></article>;})}</div>;
}
