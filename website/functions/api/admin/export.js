import {json} from '../../_lib/common.js';
import {adminGuard} from '../../_lib/site-content.js';
import {rowToAdmin} from '../../_lib/catalog-db.js';
export async function onRequestGet(c){const a=await adminGuard(c);if(!a.ok)return a.response;const r=await c.env.CATALOG_DB.prepare('SELECT * FROM content_files ORDER BY created_at DESC').all();return json({exportedAt:new Date().toISOString(),items:r.results.map(rowToAdmin)});}
