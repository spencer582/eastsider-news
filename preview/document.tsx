import React from "react";
import RootLayout, { generateMetadata as rootMetadata } from "../app/layout";
import Home, { metadata as homeMetadata } from "../app/page";
import ContentPage, { generateMetadata } from "../app/[...path]/page";
import NotFound from "../app/not-found";
import { Header } from "../components/site-client";
import { absoluteUrl, builtAt, publicPath, setPathname } from "./runtime";

export type DocumentInput = { path: string; query?: Record<string,string>; javascript?: string; styles?: string[] };
export async function makeDocument(input: DocumentInput) {
  const route = input.path.replace(/\/$/, "") || "/";
  setPathname(route);
  const args = { params: Promise.resolve({path: route.split("/").filter(Boolean)}), searchParams: Promise.resolve(input.query || {}) };
  let content: React.ReactNode, page: any;
  if (route === "/newsroom") {
    page = { title: "The Eastsider newsroom", description: "Editorial access for Eastsider News contributors." };
    content = <main id="main" className="wrap content-page"><div className="soft-panel"><span className="eyebrow">THE EASTSIDER NEWSROOM</span><h1>Writing and publishing with Eastsider.</h1><p>This public review website is open to everyone. Drafts, contributor accounts and publication are managed in the secure editorial workspace.</p><a className="button" href="https://eastsider-newsroom.spenceralexander94.chatgpt.site/newsroom">Open the editorial workspace</a><p className="fine-print">Only approved contributors need to sign in. No account is needed to read this review website.</p></div></main>;
  } else if (route === "/404") {
    content = <NotFound/>; page = {title:"Page not found"};
  } else if (route === "/") {
    content = await Home(); page = homeMetadata;
  } else {
    content = await ContentPage(args); page = await generateMetadata(args);
  }
  const root: any = await rootMetadata();
  const title = page.title ? (typeof page.title === "string" ? page.title + " | Eastsider News" : page.title.absolute) : root.title.default;
  const description = page.description || root.description;
  const og = {...root.openGraph, ...page.openGraph};
  const canonical = absoluteUrl(page.alternates?.canonical || route);
  const image = og.images?.[0];
  const imageUrl = absoluteUrl(typeof image === "string" ? image : image?.url || "/images/eastsider-social.png");
  const meta = <>
    <meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>{title}</title><meta name="description" content={description}/>
    <meta name="robots" content="noindex, follow"/><meta name="theme-color" content="#193e32"/>
    <link rel="canonical" href={canonical}/><link rel="icon" href="/favicon.svg"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
    <link rel="alternate" type="application/rss+xml" title="Eastsider News" href="/feed.xml"/>
    <meta property="og:site_name" content="Eastsider News"/><meta property="og:locale" content="en_AU"/>
    <meta property="og:type" content={og.type || "website"}/><meta property="og:title" content={page.openGraph?.title || title}/>
    <meta property="og:description" content={description}/><meta property="og:url" content={absoluteUrl(page.openGraph?.url || route)}/>
    <meta property="og:image" content={imageUrl}/><meta property="og:image:alt" content={typeof image === "object" ? image.alt || "Eastsider News" : "Eastsider News"}/>
    {og.publishedTime && <meta property="article:published_time" content={og.publishedTime}/>}{og.modifiedTime && <meta property="article:modified_time" content={og.modifiedTime}/>}
    <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={title}/><meta name="twitter:description" content={description}/><meta name="twitter:image" content={imageUrl}/>
    {(input.styles || []).map(style => <link key={style} rel="stylesheet" href={style}/>)}
  </>;
  const shell: any = RootLayout({children:React.isValidElement(content) ? React.cloneElement(content, {key:route + JSON.stringify(input.query || {})} as any) : content});
  const [head, body] = React.Children.toArray(shell.props.children) as React.ReactElement<any>[];
  const date = new Intl.DateTimeFormat("en-AU", {weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Australia/Melbourne"}).format(new Date(builtAt));
  const children = React.Children.toArray(body.props.children).map((child:any) => child.type === Header ? React.cloneElement(child,{date}) : child);
  const bootstrap = JSON.stringify({...input,query:{}}).replace(/</g,"\\u003c");
  return React.cloneElement(shell,{},
    React.cloneElement(head,{},head.props.children,meta),
    React.cloneElement(body,{},...children,
      <script id="eastsider-preview" type="application/json" dangerouslySetInnerHTML={{__html:bootstrap}}/>,
      input.javascript && <script type="module" src={publicPath(input.javascript)}/>
    )
  );
}
