import {json} from '../../_lib/common.js';
import {adminGuard,ensureContent} from '../../_lib/site-content.js';
export async function onRequestGet(c){const a=await adminGuard(c);if(!a.ok)return a.response;await ensureContent(c.env.CATALOG_DB);const r=await c.env.CATALOG_DB.prepare('SELECT id,revision,created_at createdAt,created_by createdBy FROM site_versions ORDER BY revision DESC LIMIT 30').all();return json({versions:r.results||[]});}
