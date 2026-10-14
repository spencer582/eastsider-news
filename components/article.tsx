import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Story, Contributor } from "@/lib/types";
import { authorsOf, dateLabel, isOrganisation, readingMinutes, slugify } from "@/lib/types";
import { siteOrigin } from "@/lib/content";
import { ArticleBody, Breadcrumb, Newsletter } from "./editorial";
import { ReadingProgress, ReadingTools, PrintButton, SaveButton, ShareButton, StoryCard } from "./site-client";
export function JsonLd({data}:{data:unknown}){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/>;}
export function Article({story,stories,profiles}:{story:Story;stories:Story[];profiles:Contributor[]}) {
  const url=siteOrigin()+"/articles/"+story.slug, authors=authorsOf(story);
  const primary=profiles.find(p=>p.slug===authors[0].slug);
  const schema=story.isSummary?{
    "@context":"https://schema.org","@type":"WebPage",name:story.title,url,description:"Archive reference to the original Eastsider News report.",isBasedOn:story.sourceUrl
  }:{
    "@context":"https://schema.org","@type":story.kind==="Opinion"?"OpinionNewsArticle":"NewsArticle","@id":url+"#article",
    headline:story.title,description:story.summary,image:story.image?[new URL(story.image,siteOrigin()).href]:undefined,
    datePublished:story.publishedAt,dateModified:story.modifiedAt,
    author:authors.map(a=>({"@type":profiles.find(p=>p.slug===a.slug)?.kind||(isOrganisation(a.name)?"Organization":"Person"),"@id":siteOrigin()+"/authors/"+a.slug+"#author",name:a.name,url:siteOrigin()+"/authors/"+a.slug})),
    publisher:{"@id":siteOrigin()+"/#publisher"},mainEntityOfPage:url,articleSection:story.category,inLanguage:"en-AU",isAccessibleForFree:true,
    citation:story.sourceUrl||undefined,articleBody:story.body.map(b=>b.text).join("\n\n"),wordCount:story.body.map(b=>b.text).join(" ").split(/\s+/).filter(Boolean).length,
    spatialCoverage:story.suburb?{"@type":"Place",name:story.suburb+", Victoria, Australia"}:undefined,
    correction:story.correction||undefined,
  };
  const headings=story.body.map((b,i)=>({...b,index:i})).filter(b=>b.type==="heading");
  return <>
    {!story.isSummary&&<ReadingProgress/>}
    <div className="wrap"><Breadcrumb items={[{label:story.category,href:"/topics/"+slugify(story.category)},{label:story.isSummary?"Archive report":"Article"}]}/></div>
    <article className="article-page"><header className="article-header"><div className="story-kicker"><a href={"/topics/"+slugify(story.category)}>{story.category}</a><span>{story.suburb}</span>{story.isSummary?<span>Archive</span>:story.kind&&story.kind!=="Report"?<span>{story.kind}</span>:null}</div><h1>{story.title}</h1><p className="article-deck">{story.summary}</p>
      <div className="article-byline"><span className="author-avatar">{primary?.image?<img src={primary.image} alt="" width="44" height="44"/>:story.author.split(" ").slice(0,2).map(n=>n[0]).join("")}</span><div><div>{story.isSummary?"Original report by ":"By "}{authors.map((a,i)=><span key={a.slug}>{i>0&&" and "}<a href={"/authors/"+a.slug}>{a.name}</a></span>)}</div><span><time dateTime={story.publishedAt}>{dateLabel(story.publishedAt,true)}</time>{!story.isSummary&&<> · {readingMinutes(story)} min read{story.modifiedAt!==story.publishedAt&&<> · Updated <time dateTime={story.modifiedAt}>{dateLabel(story.modifiedAt)}</time></>}</>}</span></div></div>
      <div className="article-actions"><SaveButton id={story.id} text/><ShareButton/><PrintButton/>{!story.isSummary&&<ReadingTools/>}</div>
    </header>
    {story.image&&<figure className="article-figure"><img src={story.image} alt={story.imageAlt} width="1200" height="800" fetchPriority="high" style={story.image.includes("20334")?{maxWidth:150,marginInline:"auto"}:undefined}/><figcaption>{story.imageCredit}</figcaption></figure>}
    <div className="article-reading">{story.isSummary?<section className="archive-reading"><span className="eyebrow">From the published archive</span><h2>Read the author’s original report.</h2><p>This story was published on {dateLabel(story.publishedAt,true)}. The complete article remains on the existing Eastsider News website, with its original context and attribution.</p><a className="button" href={story.sourceUrl}>Read the original article <ArrowUpRight size={17}/></a></section>:<>{headings.length>1&&<details className="article-toc"><summary>In this article</summary><ol>{headings.map(h=><li key={h.index}><a href={"#section-"+h.index}>{h.text}</a></li>)}</ol></details>}<ArticleBody story={story}/>{story.sourceUrl&&<div className="article-source"><span className="eyebrow">Source & further reading</span><a href={story.sourceUrl}>Read the source material <ArrowUpRight size={16}/></a></div>}</>}
    {story.correction&&<aside className="correction-note"><b>Correction or update</b><p>{story.correction}</p></aside>}
    {authors.map(a=>{const profile=profiles.find(p=>p.slug===a.slug);return profile?.bio?<section className="author-bio-card" key={a.slug}>{profile.image&&<img src={profile.image} alt={profile.imageAlt} width="75" height="75" loading="lazy"/>}<div><span className="eyebrow">About the contributor</span><h2>{profile.name}</h2><p>{profile.bio}</p><a className="text-link" href={"/authors/"+a.slug}>More from {profile.name} <ArrowRight size={16}/></a></div></section>:null;})}
    <div className="article-bottom"><p>Have a correction or an update?</p><a href={"mailto:eastsidernews1@gmail.com?subject="+encodeURIComponent("Correction or update: "+story.title)}>Contact the editors <ArrowUpRight size={15}/></a></div></div></article>
    <section className="section wrap"><div className="section-heading"><h2>Related stories</h2><a className="text-link" href="/news">All stories <ArrowUpRight size={17}/></a></div><div className="story-grid">{stories.filter(s=>s.id!==story.id).sort((a,b)=>Number(b.category===story.category)-Number(a.category===story.category)).slice(0,3).map(s=><StoryCard story={s} key={s.id}/>)}</div></section><Newsletter/><JsonLd data={schema}/><JsonLd data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:siteOrigin()},{"@type":"ListItem",position:2,name:story.category,item:siteOrigin()+"/topics/"+slugify(story.category)},{"@type":"ListItem",position:3,name:story.title,item:url}]}}/>
  </>;
}
