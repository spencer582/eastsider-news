import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {build} from "vite";
import ts from "typescript";

const root = process.cwd();
const siteUrl = (process.env.PREVIEW_SITE_URL || "https://spencer582.github.io/eastsider-news").replace(/\/$/, "");
const parsed = new URL(siteUrl);
if (parsed.protocol !== "https:" || parsed.search || parsed.hash || parsed.username || parsed.password) throw new Error("PREVIEW_SITE_URL must be a public HTTPS website address.");
const base = parsed.pathname.replace(/\/$/, "") + "/";
const builtAt = new Date().toISOString();
const cache = path.join(root,".preview-cache"), out = path.join(root,"pages-site");
await fs.mkdir(cache,{recursive:true});
for (const name of ["event-types","event-feed"]) {
  const source = await fs.readFile(path.join(root,"lib",name+".ts"),"utf8");
  const output = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace('"./event-types"','"./event-types.mjs"');
  await fs.writeFile(path.join(cache,name+".mjs"),output);
}
let events;
try {
  if (process.env.PREVIEW_OFFLINE === "true") throw new Error("Offline build requested");
  events = await (await import(pathToFileURL(path.join(cache,"event-feed.mjs")))).fetchEastsiderEvents();
  console.log(`Checked ${events.events.length} Eastsider event listings.`);
} catch (error) {
  events = {...JSON.parse(await fs.readFile("content/eastsider-events.json","utf8")),fallback:true};
  console.log("Using the dated event snapshot: " + error.message);
}
events.refreshing = false;
await fs.writeFile(path.join(cache,"events.json"),JSON.stringify(events));
await fs.rm(out,{recursive:true,force:true});
const shared = {
  configFile:false,root,base,publicDir:false,logLevel:"warn",
  css:{postcss:{plugins:[]}},
  define:{__PREVIEW_BASE__:JSON.stringify(base),__PREVIEW_URL__:JSON.stringify(siteUrl),__PREVIEW_BUILT_AT__:JSON.stringify(builtAt)},
  resolve:{alias:[
    {find:"@preview-react/jsx-runtime",replacement:path.join(root,"preview/jsx-runtime.ts")},
    {find:"@/lib/content",replacement:path.join(root,"preview/content.ts")},
    {find:"@/lib/contributors",replacement:path.join(root,"preview/content.ts")},
    {find:"@/lib/events",replacement:path.join(root,"preview/events.ts")},
    {find:"next/navigation",replacement:path.join(root,"preview/navigation.ts")},
    {find:"@",replacement:root}
  ]},
  plugins:[{name:"eastsider-static-preview",enforce:"pre",transform(code,id){
    if (id.endsWith(".css")) return {code:code.replace(/url\((['"]?)\/(fonts|images)\//g,(_match,quote,folder)=>"url("+quote+base+folder+"/"),map:null};
    if (!/\.(ts|tsx)$/.test(id) || id.includes("node_modules")) return;
    if (id === path.join(root,"lib/event-types.ts")) code = code.replaceAll("= new Date()", "= new Date(" + JSON.stringify(builtAt) + ")");
    if (id === path.join(root,"components/community-calendar.tsx")) code = code.replace("Connected to Eastsider’s community calendar, with selected council and organiser listings.","Eastsider’s community calendar, with selected council and organiser listings. This review copy updates when the website is rebuilt.");
    return {code:ts.transpileModule(code,{fileName:id,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:"@preview-react"}}).outputText,map:null};
  }}]
};
await build({...shared,build:{outDir:out,emptyOutDir:true,target:"es2022",manifest:true,rollupOptions:{input:path.join(root,"preview/client.tsx")}}});
const manifest = JSON.parse(await fs.readFile(path.join(out,".vite/manifest.json"),"utf8"));
const entry = Object.values(manifest).find(value=>value.isEntry);
await build({...shared,build:{outDir:path.join(cache,"server"),emptyOutDir:true,ssr:path.join(root,"preview/render.tsx"),target:"es2022",rollupOptions:{output:{entryFileNames:"render.mjs"}}}});
const renderer = await import(pathToFileURL(path.join(cache,"server/render.mjs")));
const routes = await renderer.routePaths();
for (const route of routes) {
  const target = route === "/404" ? path.join(out,"404.html") : path.join(out,route.slice(1),"index.html");
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,await renderer.render({path:route,javascript:"/"+entry.file,styles:(entry.css||[]).map(value=>"/"+value)}));
}
for (const file of await renderer.dataFiles()) {
  const target = path.join(out,file.path);
  await fs.mkdir(path.dirname(target),{recursive:true});
  const content = file.content.replaceAll(parsed.origin+"/images/",parsed.origin+base+"images/").replaceAll(parsed.origin+"/articles/",parsed.origin+base+"articles/");
  await fs.writeFile(target,content);
}
await fs.cp(path.join(root,"public"),out,{recursive:true});
await fs.writeFile(path.join(out,".nojekyll"),"");
await fs.writeFile(path.join(out,"build-info.json"),JSON.stringify({builtAt,siteUrl,routes:routes.length,eventCheckedAt:events.checkedAt,eventFallback:events.fallback},null,2));
await fs.writeFile(path.join(cache,"build-config.json"),JSON.stringify({siteUrl,base,builtAt,routes},null,2));
console.log(`Built ${routes.length} reader pages in pages-site. Preview address: ${siteUrl}/`);
