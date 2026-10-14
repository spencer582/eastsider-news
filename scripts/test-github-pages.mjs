import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
const config=JSON.parse(await fs.readFile(".preview-cache/build-config.json","utf8"));
const root=path.resolve("pages-site"), origin=new URL(config.siteUrl).origin;
const renderer=await import(pathToFileURL(path.resolve(".preview-cache/server/render.mjs")));
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
const decode=value=>value.replaceAll("&amp;","&");
for(const route of config.routes){
  const file=route==="/404"?"404.html":route.slice(1)+"/index.html";
  const html=await fs.readFile(path.join(root,file),"utf8");
  check((html.match(/<h1(?: |>|\n)/g)||[]).length===1,route+" needs one primary heading");
  check(/<meta name="robots" content="noindex, follow"/.test(html),route+" must remain a review page");
  check(/<link rel="canonical" href="https:\/\//.test(html),route+" needs an absolute canonical");
  check(/<title>.+?<\/title>/.test(html),route+" needs a title");
  check(!html.includes("signin-with-chatgpt"),route+" must not require ChatGPT sign-in");
  for(const match of html.matchAll(/(?:href|src|action)="([^"]+)"/g)){
    const raw=decode(match[1]);
    if(!raw.startsWith("/")||raw.startsWith("//"))continue;
    const url=new URL(raw,origin);
    check(url.pathname.startsWith(config.base),route+" has an asset or link outside the repository path: "+raw);
    const relative=decodeURIComponent(url.pathname.slice(config.base.length));
    const target=path.join(root,relative);
    const candidates=[target,path.join(target,"index.html")];
    check((await Promise.all(candidates.map(candidate=>fs.stat(candidate).then(stat=>stat.isFile()).catch(()=>false)))).some(Boolean),route+" has a broken local link: "+raw);
  }
  for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))check(!!JSON.parse(match[1])["@type"],route+" has valid structured data");
}
const search=await renderer.render({path:"/search",query:{q:"Maranoa"}});
check(search.replace(/<!--.*?-->/g,"").includes("1 story")&&search.includes("Maranoa Botanic Gardens"),"Search uses the actual article data");
const empty=await renderer.render({path:"/search",query:{q:"nonexistent-search-example"}});
check(empty.includes("No stories match this search"),"Search has an accurate empty state");
const editions=await renderer.render({path:"/editions",query:{year:"2025"}});
check(editions.includes("2025"),"Edition year filtering renders");
const calendar=await renderer.render({path:"/events",query:{month:"2026-11"}});
check(calendar.includes('value="2026-11"'),"Calendar query selects the requested month");
const archive=await fs.readFile(path.join(root,"articles/maranoa-botanic-gardens-achieves-100-years/index.html"),"utf8");
check(archive.includes('rel="canonical" href="https://www.eastsidernews.org.au/'),"Archive canonical retains the original publisher URL");
check(!archive.includes('"@type":"NewsArticle"'),"Archive summaries are not represented as original reporting");
const manifest=JSON.parse(await fs.readFile(path.join(root,".vite/manifest.json"),"utf8"));
const entry=Object.values(manifest).find(value=>value.isEntry);
const css=(await Promise.all((entry.css||[]).map(file=>fs.readFile(path.join(root,file),"utf8")))).join("");
check(css.includes(config.base+"fonts/newsreader.woff2"),"Locally hosted fonts work under the repository path");
const javascript=await fs.readFile(path.join(root,entry.file),"utf8");
check(!javascript.includes("NEWSROOM_OWNER_EMAIL"),"The public bundle contains no owner configuration");
check(!javascript.includes("SELECT * FROM"),"The reader bundle does not contain database access");
for(const file of await fs.readdir(path.join(root,"calendar"))){
  const ics=await fs.readFile(path.join(root,"calendar",file),"utf8");
  check(ics.startsWith("BEGIN:VCALENDAR\r\n")&&ics.endsWith("END:VCALENDAR\r\n"),file+" is a calendar download");
}
console.log(`${checks} GitHub Pages checks passed across ${config.routes.length} pages. Browser interaction is not measured by this suite.`);
