const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
export async function uploadEvidence(db,org,project,file){
 if(!types[file.type]||!file.size||file.size>10485760)throw Error('Use JPEG, PNG, WebP ou PDF de até 10 MB.');
 const path=`${org}/${project}/${crypto.randomUUID()}/${crypto.randomUUID()}.${types[file.type]}`;
 const {error}=await db.storage.from('gar-evidence').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;
 return {path,name:file.name,type:file.type,size:file.size};
}
export async function openEvidence(db,attachment,org,project){
 if(!attachment?.path?.startsWith(`${org}/${project}/`))throw Error('Arquivo fora do projeto.');
 const {data,error}=await db.storage.from('gar-evidence').download(attachment.path);if(error)throw error;
 const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=attachment.name||'evidencia';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
