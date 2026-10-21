import {json,getMascotConfig} from '../_lib/mascot-config.js';
export async function onRequestGet(context){return json({ok:true,config:await getMascotConfig(context.env.CATALOG_DB)});}
