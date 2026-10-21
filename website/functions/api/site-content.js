import {json} from '../_lib/common.js';
import {blankContent} from '../_lib/site-content.js';
export async function onRequestGet(c){
  try{const r=await c.env.CATALOG_DB?.prepare("SELECT published_json,published_revision FROM site_content WHERE id='main'").first();return json({content:r?JSON.parse(r.published_json):blankContent(),revision:r?.published_revision||0});}
  catch{return json({content:blankContent(),revision:0});}
}
