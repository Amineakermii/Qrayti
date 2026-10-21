import {json} from '../_lib/common.js';
import {DEFAULT_FAQ_CONFIG} from '../_lib/faq-defaults.js';
export async function onRequestGet(c){const row=await c.env.CATALOG_DB?.prepare("SELECT value_json FROM app_settings WHERE key='faq'").first();return json({config:row?JSON.parse(row.value_json):DEFAULT_FAQ_CONFIG});}
