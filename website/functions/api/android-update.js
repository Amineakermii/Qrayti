const RELEASE={
  versionCode:22,
  versionName:'1.12.0',
  minAndroid:28,
  apkUrl:'/api/android',
  sha256:'4F58D9B75A31784816C01F621131FA95257704F8B2D0BAEF4DD1B059B93EC284',
  releasedAt:'2026-08-22',
  mandatory:false,
  notes:[
    'إضافة Code Quest لتعلّم أساسيات Java وC وPython باللعب.',
    '27 مهمة قصيرة بإنجليزية سهلة مع شرح مباشر لكل إجابة.',
    'عوالم وشخصيات مختلفة، نقاط XP وقلوب وسلسلة إجابات صحيحة.',
    'حفظ التقدّم والرجوع تلقائيًا إلى آخر مهمة.'
  ]
};

export async function onRequestGet({env}){
  let size=0,etag='';
  if(env.COURSE_FILES){
    const head=await env.COURSE_FILES.head('android/qrayti-latest.apk');
    if(head){size=head.size||0;etag=head.httpEtag||'';}
  }
  return Response.json({...RELEASE,size},{
    headers:{
      'Cache-Control':'public, max-age=60, must-revalidate',
      'Access-Control-Allow-Origin':'*',
      'ETag':etag
    }
  });
}
