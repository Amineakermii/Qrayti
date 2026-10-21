# Qrayti Teacher Portal

Teacher page: https://qrayti.tn/teachers/
Owner dashboard: https://qrayti.tn/admin/ → Teachers / الأساتذة.

## Invite a teacher

1. Verify who the teacher is and their Tunisian university/faculty.
2. In **Teachers**, enter their name, private contact email, university and faculty.
3. Create the invitation, copy the personal link, and send it privately yourself.
4. The link is shown only at creation/rotation. It expires after 90 days. Anyone with that link can access that teacher's account; never post it publicly.
5. **Rotate link** replaces a lost link and invalidates old sessions. **Revoke access** stops further teacher access; it does not remove already published courses.

No automatic email delivery or automated verification of academic affiliation is included.

## Teacher workflow

Open the invitation and press Continue. Select licence, year, semester, track, subject and category; propose a subject if missing. Add files, check their individual titles, and confirm permission to share them. Send for review, then check My submissions for pending/approved/rejected status and rejection feedback.

French (default) and English, with saved blue light/dark themes, are available on desktop and phone. The teacher pages have a friendly mascot welcome and reduced-motion-aware animations. Admin keeps its own Arabic/English interface. Upload queues remain in memory during language/theme changes, but not after closing/reloading the page.

## Owner review

Choose a submission, download and inspect the original, and correct the course destination, title and instructor/university attribution. Approve & publish makes it available through the existing public catalog immediately. Reject requires feedback, visible only to that teacher and the owner. This approval is separate from the website editor's Publish button.

Unapproved uploads live in the private `qrayti-teacher-uploads` bucket, with no public R2 URL or custom domain. Only the owner and uploading teacher can download them. Approval copies bytes into the normal course storage and publishes the catalog row. Publication retries preserve one stable file identity.

## Limits and cautions

- PDF, DOCX, PPTX, JPEG, PNG and WebP; 25 MiB per file.
- 20 accepted/live-reserved files or 250 MiB per UTC day per teacher.
- 500 MiB outstanding per teacher (pending, rejected and live reservations).
- Maximum 60 new upload attempts per hour, including failed files.
- Macro-enabled, embedded/encrypted Office documents and malformed archives are rejected. Format checks are **not** an antivirus scan or proof of copyright ownership; the owner must review before approval.
- Teachers authenticate separately; their invitations never grant Admin access.
- Pending/rejected/approved originals are retained; this version has no automatic retention/deletion policy. Review storage usage as the service grows.

## Local checks / maintenance

Run backend tests with a local Wrangler server on port 8791 and a separate local database seeded with `database/schema.sql` and `database/teacher-portal.sql`. Use dummy admin credentials only. Tests create fixtures; never run mutation suites against production.

`node --test tests/teacher-portal.test.mjs tests/teacher-upload-recovery.test.mjs`

`node tests/teacher-admin-ui.browser.mjs --local`

Set `TEACHER_UI_REAL=1` then run `node --test tests/teacher-portal-ui.browser.mjs` for the full local browser flow.

The additive production migration is `website/database/teacher-portal.sql`; do not replace the existing database or redeploy older website folders. In this repository, deployment must use `website` with both R2 bindings and the existing CATALOG_DB. Restore and verify course assets first as described in `CLOUD-HANDOFF.md`. Preserve the current Admin secrets and stored website content.
