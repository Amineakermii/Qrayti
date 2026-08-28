(()=>{
  const cfg=Object.assign({
    mode:'drive',driveMapUrl:'remote/drive-map.json',cloudflareBaseUrl:'',cloudflarePath:'/files/{id}',fallbackToDrive:true
  },window.QraytiRemoteConfig||{});
  const state={driveMap:{},ready:false,mapPromise:null};
  const api={isNative:false,isOnline:()=>navigator.onLine!==false,remoteConfig:cfg};
  window.QraytiPlatform=api;

  // v20: the Drive/Cloudflare map is not needed on the welcome screen. Load it only
  // when a student actually opens a file, so a large future map never delays first paint.
  function ensureMap(){
    if(state.ready)return Promise.resolve(state.driveMap);
    if(state.mapPromise)return state.mapPromise;
    state.mapPromise=fetch(cfg.driveMapUrl||'remote/drive-map.json',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error(`remote map ${r.status}`);return r.json()})
      .then(dm=>{state.driveMap=dm.files||{};state.ready=true;return state.driveMap})
      .catch(()=>{state.ready=false;return state.driveMap})
      .finally(()=>{state.mapPromise=null});
    return state.mapPromise;
  }

  function googleUrls(fileId){
    if(!fileId)return null;
    const id=encodeURIComponent(fileId);
    return {provider:'google-drive',fileId,
      previewUrl:`https://drive.google.com/file/d/${id}/preview`,
      viewUrl:`https://drive.google.com/file/d/${id}/view`,
      downloadUrl:`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`};
  }
  function fillTemplate(tpl,id,fileId){
    return String(tpl||'/files/{id}')
      .replaceAll('{id}',encodeURIComponent(id||''))
      .replaceAll('{fileId}',encodeURIComponent(fileId||''));
  }
  function cloudflareUrls(id,fileId){
    if(!cfg.cloudflareBaseUrl)return null;
    try{
      const base=String(cfg.cloudflareBaseUrl).replace(/\/$/,'')+'/';
      const path=fillTemplate(cfg.cloudflarePath,id,fileId).replace(/^\//,'');
      const url=new URL(path,base).href;
      return {provider:'cloudflare',fileId,previewUrl:url,viewUrl:url,downloadUrl:url+(url.includes('?')?'&':'?')+'download=1'};
    }catch{return null}
  }
  function driveEntry(direct){
    if(!direct)return null;
    if(typeof direct==='string')return {provider:'remote',previewUrl:direct,viewUrl:direct,downloadUrl:direct};
    if(direct.fileId)return {...googleUrls(direct.fileId),provider:direct.provider||'google-drive'};
    if(direct.url)return {provider:direct.provider||'remote',previewUrl:direct.previewUrl||direct.url,viewUrl:direct.viewUrl||direct.url,downloadUrl:direct.downloadUrl||direct.url};
    return null;
  }
  function remoteFor(id){
    const direct=state.driveMap?.[id];
    const drive=driveEntry(direct);
    if(cfg.mode==='cloudflare'){
      const edge=cloudflareUrls(id,direct&&typeof direct==='object'?direct.fileId:'');
      if(edge)return {...edge,fallback:cfg.fallbackToDrive?drive:null};
    }
    return drive;
  }
  api.ready=()=>ensureMap();
  api.getRemote=async id=>{await ensureMap();return remoteFor(id)};
  api.hasRemote=async id=>{await ensureMap();return !!remoteFor(id)};
})();
