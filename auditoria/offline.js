const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('gar12-outbox',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
async function tx(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction('drafts',mode),r=fn(t.objectStore('drafts'));t.oncomplete=()=>{db.close();resolve(r.result)};t.onabort=t.onerror=()=>{db.close();reject(t.error||r.error)}})}
export const enqueue=d=>tx('readwrite',s=>s.add(d));
export const remove=id=>tx('readwrite',s=>s.delete(id));
export const pending=async scope=>(await tx('readonly',s=>s.getAll())).filter(d=>d.scope===scope);
const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
export async function syncDraft(db,d){
 const payload={...d.payload};
 if(d.file){const path=`${d.org}/${d.project}/${d.id}/${d.id}.${types[d.file.type]}`;const bucket=db.storage.from('gar-evidence');const r=await bucket.upload(path,d.file,{contentType:d.file.type,upsert:false});if(r.error){const old=await bucket.download(path);if(old.error||!old.data)throw r.error;const a=new Uint8Array(await old.data.arrayBuffer()),b=new Uint8Array(await d.file.arrayBuffer());if(a.length!==b.length||a.some((v,i)=>v!==b[i]))throw Error('Arquivo existente diferente.');}payload.attachment={path,name:d.file.name,type:d.file.type,size:d.file.size};}
 const r=await db.rpc('gar_sync_draft',{op:d.id,o:d.org,p:d.project,k:d.kind,body:payload,target:d.target||null,expected:d.revision||null});if(r.error)throw r.error;
}
