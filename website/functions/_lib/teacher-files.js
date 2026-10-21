import {Unzip,UnzipInflate} from 'fflate';
import {fail,limits,hash} from './teacher-auth.js';
const types={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
export function fileType(name){const ext=String(name).split('.').pop().toLowerCase();if(!types[ext])fail('Use PDF, DOCX, PPTX, JPEG, PNG or WebP.');return {ext,mime:types[ext]};}
function checkOffice(bytes,ext){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),text=new TextDecoder();let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0||view.getUint16(end+4,true)||view.getUint16(end+6,true))fail('Invalid Office document.');
  const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true),length=view.getUint32(end+12,true);
  if(!count||count>2000||start+length!==end||end+22+view.getUint16(end+20,true)!==bytes.length)fail('Invalid or oversized Office archive.');
  let p=start,total=0;const names=new Set(),spans=[];
  for(let i=0;i<count;i++){
    if(p+46>end||view.getUint32(p,true)!==0x02014b50)fail('Invalid Office structure.');
    const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),compressed=view.getUint32(p+20,true),size=view.getUint32(p+24,true),n=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),offset=view.getUint32(p+42,true);
    if(p+46+n+extra+comment>end||offset+30>start)fail('Invalid Office entry.');
    const name=text.decode(bytes.subarray(p+46,p+46+n));
    if(flags&1||![0,8].includes(method)||name.includes('\\')||name.startsWith('/')||name.split('/').includes('..')||names.has(name)||/vba|activex|embeddings\//i.test(name))fail('Encrypted, embedded or macro-enabled documents are not supported.');
    names.add(name);total+=size;if(total>100*1024**2)fail('The expanded document is too large.');
    if(view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+6,true)!==flags||view.getUint16(offset+8,true)!==method)fail('Mismatched Office entry.');
    const localN=view.getUint16(offset+26,true),localExtra=view.getUint16(offset+28,true),dataStart=offset+30+localN+localExtra;
    if(dataStart+compressed>start||text.decode(bytes.subarray(offset+30,offset+30+localN))!==name)fail('Invalid Office entry bounds.');
    spans.push([offset,dataStart+compressed]);p+=46+n+extra+comment;
  }
  spans.sort((a,b)=>a[0]-b[0]);if(p!==end||spans.some((s,i)=>i&&s[0]<spans[i-1][1]))fail('Overlapping Office entries.');
  const main=ext==='docx'?'word/document.xml':'ppt/presentation.xml';
  if(!names.has('[Content_Types].xml')||!names.has(main))fail('This file is not the selected Word or PowerPoint format.');
  // Streaming inflation bounds actual output, not only attacker-controlled ZIP sizes.
  let actual=0,error=null,manifest='',mainSeen=false;const seen=new Set();
  const unzip=new Unzip(file=>{
    if(!names.has(file.name)||seen.has(file.name)){error=new Error('Unexpected ZIP entry');return;}seen.add(file.name);let size=0;
    file.ondata=(err,data,final)=>{if(err){error=err;return;}actual+=data.length;size+=data.length;if(actual>100*1024**2||((file.name===main||file.name==='[Content_Types].xml')&&size>4*1024**2)){error=new Error('Expanded document too large');file.terminate?.();return;}if(file.name==='[Content_Types].xml')manifest+=text.decode(data);if(file.name===main&&final)mainSeen=size>0;};file.start();
  });unzip.register(UnzipInflate);
  try{for(let i=0;i<bytes.length;i+=4096){unzip.push(bytes.subarray(i,i+4096),i+4096>=bytes.length);if(error)throw error;}}catch{fail('Invalid or oversized Office document.');}
  if(error||!mainSeen||seen.size!==names.size||!/Types/.test(manifest)||/macroenabled|vba|activex|<!DOCTYPE|<!ENTITY/i.test(manifest))fail('Invalid or macro-enabled Office document.');
}
export async function readValidatedFile(request,row){
  const {ext,mime}=fileType(row.original_name),expected=row.size;
  if(!request.body||expected<1||expected>limits.fileBytes)fail('Invalid file size.',413);
  if(request.headers.has('Content-Length')&&Number(request.headers.get('Content-Length'))!==expected)fail('File size changed. Select the file again.');
  const reader=request.body.getReader(),bytes=new Uint8Array(expected);let offset=0;
  for(;;){const {value,done}=await reader.read();if(done)break;if(offset+value.length>limits.fileBytes){await reader.cancel();fail('Maximum file size is 25 MiB.',413);}if(offset+value.length>expected){await reader.cancel();fail('File size does not match the upload reservation.');}bytes.set(value,offset);offset+=value.length;}
  if(offset!==expected)fail('Upload was incomplete. Please retry.');
  const ascii=(from,to)=>new TextDecoder().decode(bytes.subarray(from,to));
  let valid=false;
  if(ext==='png')valid=bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)&&ascii(12,16)==='IHDR';
  if(ext==='jpg'||ext==='jpeg')valid=bytes.length>4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes.at(-2)===255&&bytes.at(-1)===217;
  if(ext==='webp')valid=bytes.length>=16&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
  if(ext==='pdf')valid=ascii(0,5)==='%PDF-'&&ascii(Math.max(0,bytes.length-2048),bytes.length).includes('%%EOF');
  if(ext==='docx'||ext==='pptx'){checkOffice(bytes,ext);valid=true;}
  if(!valid)fail('File contents do not match its format. Please choose the original document.');
  return {bytes,mime,size:bytes.length,sha256:await hash(bytes)};
}
export async function downloadPrivate(c,row){
  if(!row||!['pending','publishing','approved','rejected'].includes(row.status))fail('File not found.',404);
  const object=await c.env.TEACHER_UPLOADS.get(row.r2_key,c.request.headers.has('Range')?{range:c.request.headers}:undefined);if(!object)fail('File not found.',404);
  const headers=new Headers({'Content-Type':row.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(row.original_name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Accept-Ranges':'bytes'});
  let status=200;if(c.request.headers.has('Range')&&object.range){status=206;headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset+object.range.length-1}/${object.size}`);headers.set('Content-Length',String(object.range.length));}else headers.set('Content-Length',String(object.size));
  if(c.request.method==='HEAD'){await object.body.cancel();return new Response(null,{status,headers});}return new Response(object.body,{status,headers});
}
