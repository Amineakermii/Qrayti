export async function onRequestGet(c){
  const row=await c.env.CATALOG_DB?.prepare('SELECT r2_key,mime FROM site_media WHERE id=?1').bind(c.params.id).first();if(!row)return new Response('Not found',{status:404});
  const obj=await c.env.COURSE_FILES.get(row.r2_key);if(!obj)return new Response('Not found',{status:404});
  return new Response(obj.body,{headers:{'Content-Type':row.mime,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});
}
