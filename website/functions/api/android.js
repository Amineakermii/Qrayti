const APK_KEY='android/qrayti-latest.apk';
const APK_NAME='Qrayti-v1.12.0.apk';

function headersFor(object){
  const h=new Headers();
  h.set('Content-Type','application/vnd.android.package-archive');
  h.set('Content-Disposition',`attachment; filename="${APK_NAME}"`);
  h.set('Cache-Control','public, max-age=60, must-revalidate');
  h.set('Accept-Ranges','bytes');
  if(object?.httpEtag)h.set('ETag',object.httpEtag);
  return h;
}

export async function onRequest(context){
  const {request,env}=context;
  if(!env.COURSE_FILES)return new Response('Qrayti Android storage unavailable',{status:503});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  if(request.method==='HEAD'){
    const head=await env.COURSE_FILES.head(APK_KEY);
    if(!head)return new Response('Qrayti Android is not uploaded yet',{status:404});
    const h=headersFor(head);h.set('Content-Length',String(head.size));
    return new Response(null,{status:200,headers:h});
  }
  const object=await env.COURSE_FILES.get(APK_KEY,{range:request.headers});
  if(!object)return new Response('Qrayti Android is not uploaded yet',{status:404});
  const h=headersFor(object);
  let status=200;
  if(object.range&&Number.isFinite(object.range.offset)&&Number.isFinite(object.range.length)){
    const start=object.range.offset,end=start+object.range.length-1;
    h.set('Content-Range',`bytes ${start}-${end}/${object.size}`);
    h.set('Content-Length',String(object.range.length));status=206;
  }else h.set('Content-Length',String(object.size));
  return new Response(object.body,{status,headers:h});
}
