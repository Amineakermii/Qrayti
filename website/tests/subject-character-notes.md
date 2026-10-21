# Subject artwork and characters

The site reuses the 92 approved `subject_*.webp` assets from Android's `drawable-nodpi` directory (about 2.25 MB total). Catalog subjects use the explicit IDs in Android's `SubjectArtMap.kt`; `web2` uses the approved `webdesign` picture. A future CMS subject receives a category picture (math, database, networks, languages, web/design, electronics, programming or general) without deriving an asset URL from its ID.

`subject-character.css` must load after the existing styles. Subject pictures reserve their dimensions and load lazily. The calculator keeps its compact thumbnails. Badis retains the original inline book illustration. Hama uses an inline crow illustration; names, enabled settings, scenario selection, prompts, choices, replies and session limits retain the existing configuration behavior.

Run the browser regression with:

```powershell
node --test website/tests/subject-character.browser.test.mjs
```

The test uses real static pages/datasets and stubs only the API boundary. It decodes subject images across all eight dataset contexts, exercises category fallback for a future catalog subject, checks phone/tablet/desktop overflow and FAQ interaction, and verifies reduced motion plus disabled/enabled Hama configuration and saved dialogue. Optional `ARTIFACT_DIR` saves screenshots into an existing folder. `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` can override the installed Playwright module and browser.

The first regression run failed as expected with 0 subject images for 10 subject cards; the implementation passed the full browser case afterward. Visual review additionally caught the old mobile character-size rule and fixed navigation drawing over the FAQ, which receive scoped overrides.
