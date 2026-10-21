# Qrayti editor redesign — research and proposed direction

Status: research / design proposal, not implemented or deployed.
Date: 2026-10-18

## User outcome

The owner should be able to find a page, change its words or images, see the result, and publish confidently without understanding code. The current editor feels like unrelated controls packed into one box. A successful redesign changes the workflow and allocation of screen space, not only colors, borders or animation.

Keep Qrayti blue, Arabic/English, RTL/LTR, light/dark, the approved sun/moon control, the existing password/session, saved content and publication history. Focus this redesign on Website editor; course uploads and teacher administration remain reachable through Back to admin.

## Evidence in the current implementation

- `site/admin/v2.js` renders homepage fields, brand/contact fields, the selected-item form and all overrides in one `.editor-controls` stack.
- `site/admin/editor-tools.js` prepends another large section containing the page picker, raw route input, popup controls, text search and inventory to that same stack.
- `selectPicked()` scrolls the chosen form into view. The form can sit far below the preview, so selecting an item changes the user's view instead of bringing relevant tools beside it.
- A permanent 245px administration sidebar and the editor controls consume width before the actual preview gets its share.
- Mobile CSS places controls before the preview; reaching the website requires traversing settings first.
- The current desktop preview is constrained by the available column rather than clearly presenting a chosen viewport width. Preview size and physical screen size need distinct labels.
- Raw route paths, attribute names and “overrides” leak implementation concepts into an owner-facing editing workflow.
- Underlying draft/public separation and revision conflict checks are useful and should be preserved.

## Research and application

### Shopify: contextual inspection and adaptive panels

Sources:
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview

The inspector connects a selected preview element to its settings. Panels can collapse to expand the preview; panel placement adapts to screen width. Apply these principles without copying commerce features. Qrayti should not keep page navigation, global settings and item properties open at once on a laptop.

### Framer: content in its page context

Source: https://www.framer.com/help/articles/on-page-editing/

Content editing highlights supported elements and keeps authors in the page context. Qrayti should use a clearly labelled Edit / Browse mode, selection outlines and a prefilled contextual editor. Selecting must not navigate a link or scroll the outer workspace to a distant form. Page popups require deliberate shortcuts because they are not ordinary visible text.

### Webflow: canvas, tools and site actions have different roles

Sources:
- https://help.webflow.com/hc/en-us/articles/33961260162323-Intro-to-Webflow
- https://help.webflow.com/hc/en-us/articles/33961319255059-Webflow-canvas-overview

The canvas is the main work area, with navigation, selected-element controls and publishing separated around it. Borrow this separation and explicit preview mode, not its large technical CSS/interactions surface. Qrayti's owner is editing a supported website, not authoring arbitrary HTML/CSS.

### WordPress: distinguish content editing and template editing

Source: https://wordpress.org/documentation/article/site-editor-pages/

Page content, template editing and publication status are distinct. Qrayti should show available templates in their own view and review changes before publishing; it must not imply that unsupported templates or arbitrary layout controls already work.

### Progressive disclosure

Source: https://www.nngroup.com/articles/progressive-disclosure/

Frequent actions belong in the first view; secondary controls appear when requested. This is the main correction to the current editor. Keep choosing a page, selecting content and reviewing publication obvious. Hide route strings and low-level metadata behind details, not in the default workflow.

### Accessible interaction

Sources:
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

Panels need labelled controls, keyboard operation and predictable focus. Sheets/dialogs need Escape and focus restoration. Preserve native text undo while typing; editor-level undo must not hijack it. No drag-only essential controls. Motion should be brief, interruptible and respect reduced-motion.

## Alternatives

1. **Focused studio (recommended):** full-height preview with one contextual inspector and a collapsible page/section navigator. Most direct for visual word/photo editing, while retaining supported site settings.
2. **Guided forms:** choose page, fill grouped fields, open a separate preview. Easier to implement but separates editing from its visual result and risks recreating the current long forms.
3. **Full drag-and-drop builder:** most flexible, but requires a new layout/content model and creates unnecessary ways to break existing course and teacher flows. Not recommended for this update.

## Proposed interaction

- Enter a dedicated studio with a compact top bar and Back to admin, rather than nesting another editor inside the full admin sidebar.
- Top bar: page selector, Edit / Browse, device preview, save state, Save draft and Review & publish. Secondary language/theme controls stay reachable without another oversized header.
- Page selector: grouped human-readable pages, licences/years/semesters, and teacher languages. Search by name. No raw URL required.
- Center: real website preview, dominant in the layout. Explicit device width and Fit / Actual size prevent a narrow laptop column being mistaken for a full desktop preview.
- Inspector: click a supported word or picture; only its current content, image chooser, scope and reset control appear. No other homepage/brand form below it.
- Scope defaults to This page. Applying across pages is explicit and names the affected scope. Teacher languages remain distinct.
- Sections: a named list of editable page regions (header, main heading, university strip, footer) where recognized; text search remains a fallback for other screens.
- Brand, templates, media and change review open as deliberate views, not stacked cards. Template choices show actual supported availability.
- Changes: group edits by page, show before/after and allow undo/reset before publishing. Clearly distinguish unsaved, saved draft, publishing, published and failed states.
- Local editing undo/redo should be separate from publication history. Keep explicit Save draft initially; do not add unsafe autosave without resolving multi-session conflicts.
- Laptop: one side panel at a time; selecting an element can replace the navigation panel with a Back to sections path. Large screens may expose an optional navigator alongside the inspector. No permanent three-panel squeeze.
- Phone: preview-first interface with a labelled, dismissible editor sheet. Navigation and properties must not become a tall block above the page.
- Visual tone: calm white/slate surfaces, Qrayti blue selection accents, consistent line icons and readable labels. No giant dashboard heading, decorative statistics, gradients or floating ornaments in the editing workspace.

## Release boundaries

The research does not authorize a migration to Shopify, Framer, Webflow or WordPress. Reuse the existing Qrayti backend and protect all live content. A complete drag-and-drop layout engine, new homepage templates, native APK editing and arbitrary editing of private teacher data are not implied by the visual redesign.

Before release, verify the core task on laptop and phone: open a subject, change text/image, navigate away and back without losing work, preview both teacher languages, undo, save, reload, review changes, and publish only through explicit confirmation. Test RTL, dark mode, keyboard focus, reduced motion, and existing authentication/privacy boundaries.

## Local skill guidance

The UI/UX skill's generic design-system lookup returned a marketing landing-page pattern, and the narrower CMS product lookup found no verified match. Neither was adopted. The proposal uses the directly inspected product documentation above, existing Qrayti design preferences, and the skill's general accessibility/layout rules.
