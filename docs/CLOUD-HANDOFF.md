# Work on Qrayti in the cloud

Prepared: 20 October 2026. Migration branch: `codex/cloud-ready`.

## For the owner

GitHub stores the code and change history. Cloudflare continues to host the website, database, uploads and downloadable app. A **Cloud environment** runs editing/build/test tasks away from your PC; switching to a local Work chat alone does not move that work off your PC.

1. Open Work/Codex and choose **Work in → Cloud → Select environment → Create environment** (also available through Settings → Codex Cloud → Environments).
2. Connect GitHub and select `Amineakermii/Qrayti`. Use the migration branch `codex/cloud-ready` until its pull request is reviewed and merged.
3. Configure the setup below, review the environment's setup report, then **Publish** it.
4. Start the next cloud task with: “Read AGENTS.md and docs/CLOUD-HANDOFF.md. Continue Qrayti on codex/cloud-ready. Do not deploy or reset live content without asking.”

The migration does not automatically create/publish a cloud environment or transfer this chat's full history. Personal desktop skills, local browser sessions and credentials do not move automatically. This handoff is the portable project context.

Official setup: https://learn.chatgpt.com/docs/environments/cloud-environments

## Where things live

| Item | Location |
| --- | --- |
| Website, admin, teachers, APIs, Android source, artwork, tests | This GitHub repository |
| Live website | https://qrayti.tn |
| Course documents | Existing Cloudflare Pages assets / R2, excluded from Git |
| Live CMS edits, FAQs, teacher records | Existing Cloudflare services, not copied to Git |
| Admin/API/signing secrets | Existing secure storage; not transferred |
| Local project and backups | Unchanged on the owner's PC |

The migration uses a clean clone. The older dirty `public-repo/Qrayti` checkout and original working folders were not reset or deleted. Nothing in this migration publishes a new live website.

## Cloud setup

Use Node.js 22 or newer. Run from the repository:

```sh
cd website
npm ci
npx playwright install --with-deps chromium
npm test
```

The standard suite checks course-preservation safety, editor coverage, teacher upload validation/recovery, subject artwork, teacher UI and theme switching. Backend integration tests are separate and need local database fixtures; do not use live credentials for tests.

For a local preview inside a cloud environment:

```sh
cd website
npm run dev
```

Expose the development port using the environment's preview facilities if available. This starts a local service, not a production deployment. Course binaries are omitted, so local previews need restoration to open those files.

## Critical: preserve courses before any deployment

There are about 1,993 static course files (~1 GB) outside Git. Deploying `website/site` straight from a fresh clone would remove those files from that deployment.

```sh
cd website
npm run content:restore
npm run release:check
```

Restoration reads the currently public `https://qrayti.tn/content/...` URLs and checks every file against `tools/course-content-manifest.json` (path, size and SHA-256). It does not upload third-party documents to GitHub. Existing mismatched local files are not overwritten. Missing, changed or inaccessible assets block the check. Two larger R2-backed course files stay in R2 and must retain their routes.

This is a recovery mechanism, not an independent off-site backup. Keep the owner's local course archive until a separate approved backup exists. Update the manifest deliberately when course assets change; do not “fix” failed integrity checks by weakening them.

Cloudflare configuration is in `website/wrangler.toml`. Production project: `qrayti`. Before the first cloud deployment, inspect existing Git auto-deploy settings, restore assets and get the owner's approval. Configure a narrowly scoped Cloudflare token only through the environment's secret settings. Never paste it into code, a chat prompt or a commit. No deploy workflow is enabled by this migration.

The website CI runs read-only tests on pull requests. The existing Android workflow also runs its checks. Production database contents, secrets and uploaded teacher files are not exported by CI.

## Current state and next work

The imported website includes Admin v2, page-text editing, teacher submissions/moderation, blue light/dark themes and the animated sun/moon switch, subject artwork, and the recent mascot/footer refinements. Existing saved FAQ and Hama dialogue must be preserved.

The owner considers the editor too crowded and requested a much larger update. Research and a proposed full-screen editor are documented in `editor-studio-research.md`; that new editor has **not** been implemented. The cloud migration is the current priority. Do not describe the editor redesign as finished.

Related guides: `admin-v2-guide.md`, `teacher-portal-guide.md`, `design-preferences.md`.
