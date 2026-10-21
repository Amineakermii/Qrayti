# Qrayti Admin v2

The owner needs to manage the website without editing code. Build on the existing Pages, D1, R2 and password session. Keep current content as the fallback; do not reset mascot/FAQ data or publish sample text.

## Interface
Arabic/English with UK and green Arabic flags, persisted preference, RTL/LTR layout. A clean sidebar groups Overview, Website editor, Templates, Media, Courses, Upload, FAQ, Mascot and History. Mobile navigation collapses. Saved/draft/published states and errors must be explicit.

## Website editor
Structured homepage, identity, colors and contact controls plus an embedded actual site preview. In select mode, click a text node or image on any navigable app screen to edit it. Text replacement is plain text scoped to the exact route or all pages, never executable HTML. A preview message is accepted only from the same-origin parent. Existing source text remains the fallback.

## Persistence
New site_content row stores separate draft and published JSON with an optimistic revision. Publishing is transactional with a version history entry. Restoring a version produces a draft. Public readers receive only published content. Drafts and uploads require the existing admin session; mutation requests check same-origin. Media is raster-only, size-limited, signature checked, immutable in R2 and served with nosniff. No deletion needed for the first media library.

## Templates
Registry exposes the current homepage and the current homepage with motion. Future layouts are marked unavailable until their renderer is built. Selecting a template only changes the draft. An optional homepage photo is supported.

## Existing content tools
Keep a recoverable copy of the old admin. Implement the missing course list/export, FAQ and file-serving endpoints; retain the established uploads and metadata schema. New interface includes multi-file upload, full metadata editing, search and publish/hide states. Course actions clearly save immediately; website changes use draft/preview/publish.

## Verification
Run local Workers with isolated D1/R2 and temporary test credentials. Test authentication, invalid payloads/media, draft/public separation, concurrent edit conflicts, publish and restore. Browser checks cover Arabic/English, mobile layout, visual selection, text replacement, upload, modal edits and a fresh published page. Verify a Cloudflare preview before deploying production. Do not mutate real content while testing.
