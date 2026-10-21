import {requireAdmin,noStore} from '../../_lib/auth.js';
export async function onRequest(context){
  const a=await requireAdmin(context);if(!a.ok)return a.response;
  let counts={total:0,published:0,draft:0};
  if(context.env.CATALOG_DB){
    const r=await context.env.CATALOG_DB.prepare("SELECT COUNT(*) total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) draft FROM content_files").first().catch(()=>null);
    if(r)counts={total:Number(r.total)||0,published:Number(r.published)||0,draft:Number(r.draft)||0};
  }
  return Response.json({ok:true,email:a.email,counts},{headers:noStore()});
}
