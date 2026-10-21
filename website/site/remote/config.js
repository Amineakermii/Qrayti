// Qrayti FULL-HOST: courses are served from the same host first.
window.QraytiRemoteConfig={
  schemaVersion:1,
  preferLocalContent:true,
  mode:'drive',
  driveMapUrl:'remote/drive-map.json',
  cloudflareBaseUrl:location.origin,
  cloudflarePath:'/files/{id}',
  fallbackToDrive:true
};
