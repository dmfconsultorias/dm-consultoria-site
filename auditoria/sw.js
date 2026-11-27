const BASE=new URL('./',self.location.href);
const VERSION='V14.5';
const CACHE='gar-auditoria-shell-v14-5';
const SHELL=['index.html','config.js','app.js','forms.js','evidence.js','offline.js','manifest.webmanifest','icon-192.png','icon-512.png'].map(p=>new URL(p,BASE).href);
const CDN='https://cdn.jsdelivr.net/npm/';
const ENTRY=CDN+'@supabase/supabase-js@2/+esm';
async function prepare(){
 const c=await caches.open(CACHE);
 for(const url of SHELL){const r=await fetch(new Request(url,{cache:'reload'}));if(!r.ok)throw Error('Arquivo indisponível: '+url);if(url===SHELL[0]&&!(await r.clone().text()).includes("const VERSION='V14.5'"))throw Error('Publicação incompleta');await c.put(url,r);}
 // Precache the ESM dependency graph, including relative jsDelivr imports.
 const seen=new Set();async function module(url){if(seen.has(url))return;seen.add(url);if(!url.startsWith(CDN))throw Error('Dependência externa inesperada');const r=await fetch(url,{cache:'reload',mode:'cors'});if(!r.ok)throw Error('Dependência indisponível');const src=await r.clone().text();await c.put(url,r);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;for(const m of src.matchAll(re)){if(m[1].startsWith('/')||m[1].startsWith('.')||m[1].startsWith('https:'))await module(new URL(m[1],url).href);}}
 await module(ENTRY);await c.put(new URL('__gar_ready__',BASE).href,new Response(VERSION));
}
self.addEventListener('install',e=>e.waitUntil((async()=>{try{await prepare();await self.skipWaiting();}catch(err){await caches.delete(CACHE);throw err;}})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();for(const k of await caches.keys())if(k!==CACHE&&k.startsWith('gar-auditoria-shell-'))await caches.delete(k);})()));
self.addEventListener('message',e=>{if(e.data==='GAR_VERSION')e.waitUntil((async()=>{const c=await caches.open(CACHE);const ready=await c.match(new URL('__gar_ready__',BASE).href);e.ports[0]?.postMessage(ready&& (await Promise.all(SHELL.map(u=>c.match(u)))).every(Boolean)?VERSION:'INCOMPLETE');})());});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;const canonical=new URL(u.pathname,u.origin).href;const nav=e.request.mode==='navigate'&&u.origin===BASE.origin&&(u.pathname===BASE.pathname||u.pathname===BASE.pathname+'index.html');const local=SHELL.includes(canonical);const cdn=u.href.startsWith(CDN)&&e.request.destination==='script';if(!nav&&!local&&!cdn)return;e.respondWith((async()=>{const c=await caches.open(CACHE);const key=nav?SHELL[0]:local?canonical:e.request;const cached=await c.match(key);if(cached)return cached;const r=await fetch(e.request);if(r.ok&&r.type!=='opaque')await c.put(key,r.clone());return r;})());});
