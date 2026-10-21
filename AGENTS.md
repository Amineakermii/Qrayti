# Qrayti cloud working instructions

## Source of truth

- `website/`: Cloudflare Pages frontend, Functions, database schemas and tests. The owner's older local directory was named `website-release`; use `website` here.
- `app/`: native Android source. Do not create or publish an APK without the owner's release request and secure signing setup.
- `docs/CLOUD-HANDOFF.md`: setup, safety and current work.
- `docs/editor-studio-research.md`: proposed editor redesign, NOT implemented or approved. Resume with the owner before changing its workflow.

## Safe workflow

Work on a `codex/` branch and submit a pull request. Do not force-push, merge, change Cloudflare bindings or deploy production without the owner's authorization. Never assume a source-only deployment is safe.

Course documents (~1 GB) are deliberately NOT in Git. Most are static Pages assets, and two large files are served by R2. Before deployment, restore the static files using `npm run content:restore` in `website`, then run `npm run release:check`. A missing/mismatched file must block deployment. Existing public files can be restored only if their bytes match the tracked manifest. If recovery fails, ask for the owner's archive; do not remove the checks. Review permissions before adding any third-party course document.

Keep credentials, admin passwords, Cloudflare tokens, Android signing keys, `.dev.vars`, `.env`, databases, teacher submissions and backups out of Git and logs. Existing production content, FAQ, mascot dialogue and admin credentials remain on Cloudflare; do not reset them from source defaults.

## Verification

Node 22+, then `cd website && npm ci && npx playwright install --with-deps chromium && npm test`.
`npm test` uses temporary local servers/stubbed APIs; it does not require production credentials. `npm run dev` runs locally. Separate integration tests require a seeded LOCAL Wrangler database; consult their headers and the teacher guide. Never aim mutating tests at production.

## Product rules

Qrayti is blue, not green. Preserve the approved sun/moon theme switch. Admin supports Arabic/English and RTL/LTR; teacher pages use French/English with a friendly presentation. Preserve subject illustrations, course navigation, rights notices, saved content, current authentication and teacher moderation. Never replace live text with old hard-coded examples during a UI update.
