import type { Metadata } from "next";
import { Header } from "@/components/site-client";
import { Footer } from "@/components/editorial";
import { siteOrigin, indexingEnabled } from "@/lib/content";
import "./globals.css";
import "./calendar.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return {
  metadataBase: new URL(siteOrigin()),
  title: { default: "Eastsider News | Local news for Melbourne’s eastern suburbs", template: "%s | Eastsider News" },
  description: "Free, independent community news for Melbourne’s eastern suburbs. Local stories, people, arts, environment and events from Boroondara, Whitehorse and beyond.",
  robots: { index: indexingEnabled(), follow: indexingEnabled(), googleBot: { index:indexingEnabled(),follow:indexingEnabled(),"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1 } },
  openGraph: { siteName:"Eastsider News", locale:"en_AU", type:"website", images:[{url:"/images/eastsider-social.png",width:1200,height:630,alt:"Eastsider News, independent community news for Melbourne’s east"}] },
  twitter: {card:"summary_large_image"}, icons: { icon:"/favicon.svg", apple:"/apple-touch-icon.png" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
}; }
export default function RootLayout({children}:{children:React.ReactNode}) {
  const date=new Intl.DateTimeFormat("en-AU",{ weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Australia/Melbourne" }).format(new Date());
  const publisher={"@context":"https://schema.org","@type":"NewsMediaOrganization","@id":siteOrigin()+"/#publisher",name:"Eastsider News",legalName:"Independent Community News Group Incorporated",url:siteOrigin(),logo:siteOrigin()+"/apple-touch-icon.png",email:"eastsidernews1@gmail.com",foundingDate:"2020",areaServed:[{ "@type":"Place",name:"Boroondara, Victoria" },{ "@type":"Place",name:"Whitehorse, Victoria" }],publishingPrinciples:siteOrigin()+"/editorial-values",ethicsPolicy:siteOrigin()+"/editorial-values",actionableFeedbackPolicy:siteOrigin()+"/contact",sameAs:["https://www.eastsidernews.org.au/"],contactPoint:{"@type":"ContactPoint",contactType:"Editorial enquiries",email:"eastsidernews1@gmail.com"}};
  return <html lang="en-AU"><head><link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/newsreader.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><a className="skip-link" href="#main">Skip to main content</a><Header date={date}/>{children}<Footer/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(publisher).replace(/</g,"\\u003c")}}/></body></html>;
}
