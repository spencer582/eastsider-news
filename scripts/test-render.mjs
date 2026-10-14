import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
globalThis.fetch=async()=>{throw new Error('Offline fixture exercises the published event fallback');};
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'eastsider-render-'));
fs.symlinkSync(path.join(root,'node_modules'),path.join(tmp,'node_modules'),'dir');
const seen=new Set();
function compile(file){
  if(seen.has(file))return;seen.add(file);
  const to=path.join(tmp,file.replace(/\.(tsx?|json)$/,'.mjs'));
  fs.mkdirSync(path.dirname(to),{recursive:true});
  if(file.endsWith('.json')){fs.writeFileSync(to,'export default '+fs.readFileSync(path.join(root,file),'utf8'));return;}
  let source=fs.readFileSync(path.join(root,file),'utf8').replace(/import\s+["'][^"']+\.css["'];?/g,'');
  source=source.replace(/from\s+["']([^"']+)["']/g,(match,name)=>{
    let target;
    if(name==='cloudflare:workers')target=path.join(tmp,'platform.mjs');
    else if(name==='next/navigation')target=path.join(tmp,'navigation.mjs');
    else if(name==='@/app/chatgpt-auth')target=path.join(tmp,'identity.mjs');
    else if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?name.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),name));
      const found=[base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile());
      if(!found)throw new Error('Missing local import '+base);
      compile(found);target=path.join(tmp,found.replace(/\.(tsx?|json)$/,'.mjs'));
    }
    return target?'from '+JSON.stringify(pathToFileURL(target).href):match;
  });
  const {outputText}=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
  fs.writeFileSync(to,outputText);
}
fs.writeFileSync(path.join(tmp,'navigation.mjs'),`export function usePathname(){return '/';}export function notFound(){throw new Error('NOT_FOUND');}`);
fs.writeFileSync(path.join(tmp,'identity.mjs'),`export async function getChatGPTUser(){return null;}export function chatGPTSignInPath(){return '/sign-in';}`);
fs.writeFileSync(path.join(tmp,'platform.mjs'),`import {DatabaseSync} from 'node:sqlite';export const background=[];export function waitUntil(promise){background.push(promise);}export const sqlite=new DatabaseSync(':memory:');export const env={PUBLIC_INDEXING:'false',PUBLIC_SITE_URL:'https://news.example.test',DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this;},async all(){return {results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null;}}}}};`);
try{
  for(const file of ['app/page.tsx','app/[...path]/page.tsx','app/layout.tsx','app/sitemap.xml/route.ts','app/news-sitemap.xml/route.ts','app/feed.xml/route.ts','app/robots.txt/route.ts'])compile(file);
  const platform=await import(pathToFileURL(path.join(tmp,'platform.mjs')));
  for(const migration of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())platform.sqlite.exec(fs.readFileSync(path.join('drizzle',migration),'utf8'));
  const load=file=>import(pathToFileURL(path.join(tmp,file.replace(/\.tsx?$/,'.mjs'))));
  const home=await load('app/page.tsx'),pages=await load('app/[...path]/page.tsx'),layout=await load('app/layout.tsx');
  let checks=0;
  const check=(value,expected,label)=>{assert.equal(value,expected,label);checks++;};
  const render=element=>renderToStaticMarkup(React.createElement(layout.default,{children:element}));
  const homeHtml=render(await home.default());
  await Promise.all(platform.background);
  check((homeHtml.match(/<h1[ >]/g)||[]).length,1,'Homepage has one primary heading');
  check(homeHtml.includes('Maranoa Botanic Gardens achieves 100 years'),true,'Original lead headline is rendered');
  check(homeHtml.includes('https://www.eastsidernews.org.au/local-government/boroondara/maranoa-botanic-gardens-achieves-100-years/'),true,'Archive card opens original report');
  check(homeHtml.includes('Sarah Brennan'),true,'Second contributor is credited');
  check(homeHtml.includes('aria-label="Main navigation"'),true,'Main navigation is labelled');
  check(homeHtml.includes('href="/events" class="mobile-priority"'),true,'Calendar stays within immediate reach on mobile');
  check(homeHtml.includes('src="/images/20334-small.webp"'),false,'A low resolution archive photo is not enlarged as a card image');
  for(const route of ['news','authors','authors/sarah-brennan','places/boroondara','search','editions','events','events/kew-historical-society-2026-dickinson-lecture','community','about','contribute','subscribe','privacy','saved']){
    const args={params:Promise.resolve({path:route.split('/')}),searchParams:Promise.resolve(route==='search'?{q:'native plants',section:'Environment'}:{})};
    const html=render(await pages.default(args));
    check((html.match(/<h1[ >]/g)||[]).length,1,route+' has exactly one primary heading');
    check(html.includes('id="main"'),true,route+' has skip-link target');
    for(const image of html.matchAll(/<img\b[^>]*>/g))check(/\balt=/.test(image[0]),true,route+' image has an alternative attribute');
    const metadata=await pages.generateMetadata(args);check(!!metadata.title,true,route+' has a page title');
  }
  const calendarHtml=render(await pages.default({params:Promise.resolve({path:['events']}),searchParams:Promise.resolve({month:'2026-10'})}));
  check(calendarHtml.includes('temporarily unavailable'),true,'Feed outage is visible and the sourced fallback renders');
  check(calendarHtml.includes('calendar-grid'),true,'Month calendar is server rendered');
  check(calendarHtml.includes('Young Explorers'),true,'Verified Manningham listing is present');
  const eventHtml=render(await pages.default({params:Promise.resolve({path:['events','kew-historical-society-2026-dickinson-lecture']}),searchParams:Promise.resolve({})}));
  check(eventHtml.includes('Add to calendar'),true,'Event page has a working calendar-download route');
  check(eventHtml.includes('\"@type\":\"Event\"'),true,'Event detail has matching Event structured data');
  check(eventHtml.includes('Source checked'),true,'Event provenance is visible');
  check(eventHtml.includes('/events?month=2026-10'),true,'Event detail returns readers to the right calendar month');
  const archiveArgs={params:Promise.resolve({path:['articles','maranoa-botanic-gardens-achieves-100-years']}),searchParams:Promise.resolve({})};
  const archive=render(await pages.default(archiveArgs));check(archive.includes('Read the author’s original report.'),true,'Archive page explains provenance');check(archive.includes('"@type":"NewsArticle"'),false,'Archive reference is not labelled as original reporting');
  const archivedMeta=await pages.generateMetadata(archiveArgs);check(archivedMeta.robots.index,false,'Archive reference is noindex');check(archivedMeta.alternates.canonical.startsWith('https://www.eastsidernews.org.au/'),true,'Archive canonical points to original');
  const now=new Date().toISOString(),story={id:'render-fixture',slug:'render-fixture',title:'A supplied article for structural checks',summary:'A supplied article summary used only in a temporary test database.',body:[{type:'paragraph',text:'The approved article text goes here.'},{type:'heading',text:'A second part'},{type:'paragraph',text:'Additional text supplied by the author.'},{type:'heading',text:'Further reading'}],author:'Test Writer',authorSlug:'test-writer',coauthors:['Second Writer'],kind:'Opinion',category:'Community',suburb:'Balwyn',image:'/images/20179.webp',imageAlt:'A garden entrance',imageCredit:'Test fixture',sourceUrl:'https://example.test/source',isSummary:false,publishedAt:now,modifiedAt:now,featured:true,correction:'A clearly stated material correction.'};
  platform.sqlite.prepare('INSERT INTO stories VALUES (?,?,?,?,?,?,?,?,?)').run(story.id,story.slug,story.title,JSON.stringify(story),JSON.stringify(story),'test','published',1,now);
  const profile={id:'test-writer',slug:'test-writer',name:'Test Writer',bio:'A biography provided and approved by the contributor.',location:'Balwyn',kind:'Person',image:'',imageAlt:'',imageCredit:'',website:'https://example.test/writer',updatedAt:now};
  platform.sqlite.prepare('INSERT INTO contributors VALUES (?,?,?,?,?,?,?,?)').run(profile.id,profile.slug,JSON.stringify(profile),JSON.stringify(profile),'test','published',1,now);
  const native=render(await pages.default({params:Promise.resolve({path:['articles',story.slug]}),searchParams:Promise.resolve({})}));
  check(native.includes('Opinion'),true,'Opinion is visibly labelled');check(native.includes(profile.bio),true,'Author bio appears beneath native article');check(native.includes(story.correction),true,'Correction is visible');check(native.includes('id="section-1"'),true,'Article contents links have real targets');
  const schemas=[...native.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const article=schemas.find(s=>s['@type']==='OpinionNewsArticle');check(article.author.length,2,'Both authors appear in structured data');check(article.datePublished,story.publishedAt,'Structured publication date matches visible source');
  const profileHtml=render(await pages.default({params:Promise.resolve({path:['authors','test-writer']}),searchParams:Promise.resolve({})}));check(profileHtml.includes('"@type":"ProfilePage"'),true,'Contributor has ProfilePage structured data');
  const sitemap=await (await load('app/sitemap.xml/route.ts')).GET();const xml=await sitemap.text();check(xml.includes('/articles/render-fixture'),true,'Original article is in sitemap');check(xml.includes('/articles/maranoa-'),false,'External archive reference is excluded');check(xml.includes('/authors/sarah-brennan'),true,'Coauthor is discoverable');
  const news=await (await load('app/news-sitemap.xml/route.ts')).GET();check((await news.text()).includes('/articles/render-fixture'),true,'Fresh original reporting is in news sitemap');
  const robots=(await (await load('app/robots.txt/route.ts')).GET());check((await robots.text()).includes('Disallow: /'),true,'Private review blocks indexing');
  platform.sqlite.close();
  console.log(`${checks} server-rendering and discovery checks passed. Browser interaction and visual layout are not measured by this suite.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
