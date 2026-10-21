import {checkPassword,makeCookie,logoutCookie,noStore,adminEmail} from '../_lib/auth.js';
export async function onRequest(context){
  if(context.request.method==='POST'){
    const body=await context.request.json().catch(()=>({}));
    if(!checkPassword(context,body.password))return Response.json({error:'Wrong password'},{status:401,headers:noStore()});
    return Response.json({ok:true,email:adminEmail(context)},{headers:noStore({'Set-Cookie':await makeCookie(context)})});
  }
  if(context.request.method==='DELETE')return new Response(null,{status:204,headers:noStore({'Set-Cookie':logoutCookie()})});
  return Response.json({error:'Method not allowed'},{status:405,headers:noStore()});
}
