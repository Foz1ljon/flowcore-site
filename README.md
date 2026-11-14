# FlowCore landing page

Static site (HTML + CSS + vanilla JS). Generated assets and product pages are
committed, so production needs no Node.js runtime. Deploy the public files and
product folders with nginx, Cloudflare Pages, Vercel or GitHub Pages; exclude
`node_modules`, `.git`, and development tools from the upload.

```bash
npm run dev   # local preview → http://127.0.0.1:8080 (includes branded 404)
```

## Before going live

1. **Domain** — replace `https://flowcore.uz` in `index.html` (canonical, hreflang,
   Open Graph, JSON-LD), `robots.txt` and `sitemap.xml` if the domain differs.
2. **Lead form** — set `CONTACT` at the top of `assets/js/main.js`:
   `endpoint` (defaults to `/api/public/leads`), or `telegramUsername`, or `email`. Verify ownership of
   the configured address (`info@flowcore.uz` is the existing default). Without an
   endpoint, submission prepares a visible draft; the visitor explicitly opens
   email/Telegram to send it. Copy and TXT download work independently of delivery.
   Only a successful endpoint response is shown as a received request. Endpoint
   calls time out after 15 seconds; cross-origin endpoints must allow this origin.
3. Submit `sitemap.xml` to Google Search Console and Yandex Webmaster.

## Files

- `404.html` — generated Uzbek error page with home, history-back and module
  links. It is excluded from the sitemap and has `noindex`. The dev server and
  nginx static snippet serve it with HTTP 404 while preserving the requested
  URL; there is no redirect to a successful home-page response. Run
  `npm run dev -- --port 8081` to choose a different local port. Production needs
  the updated nginx snippet installed and nginx configuration reloaded.

- Search metadata lives in `tools/seo.mjs`. The site remains Uzbek. Each page
  has its own title, canonical, FAQ/software structured data and sitemap entry.
  English and Russian module terminology appears in search metadata without a
  language switcher or translated pages. FlowCore is the official name; CoreFlow
  is addressed as a search spelling in a visible FAQ.
  Publish the generated pages before requesting indexing in Search Console or
  Yandex Webmaster. Metadata does not guarantee ranking or immediate indexing.
- Contact anchors: same-page links and incoming `/#aloqa` links centre the contact
  grid on desktop and the form on stacked layouts, accounting for the header.
  The `#top` target belongs to the page body, so footer and logo links scroll to
  the document start rather than a fixed header.

- `/privacy/` and `/terms/` — Uzbek privacy and service terms, generated from
  `tools/legal-content.mjs` by `tools/generate-legal.mjs`. Update the version/date
  with substantive policy changes. Both pages are linked from every public page,
  included in the sitemap and support light/dark themes and mobile navigation.
  The inquiry form requires a separate unchecked contact-data consent choice.
  This is a client-side gate; the existing leads API does not store a structured
  consent/version receipt. Do not describe it as an audited consent registry.
  Complete the legal operator's name, STIR/address, confirmed contact ownership,
  hosting locations and agreed retention/service details before treating these
  pages as the complete contractual disclosure for a live customer agreement.

- `index.html` — page, meta/OG/Twitter tags, JSON-LD (Organization, WebSite,
  SoftwareApplication, FAQPage)
- `assets/css/style.css` — light/dark tokens at the top (`:root`, `[data-theme]`). Brand colours
  follow the app: emerald `#10b981` (`frontend/playground/shared/brand.ts`), logo `#064e3b` /
  `#6ee7b7`, zinc neutrals; logo SVG from `frontend/playground/public/brand/`. One colour per module (`--c-wms` … `--c-lms`); respects `prefers-reduced-motion`
- `assets/js/main.js` — theme toggle (dark mode by default; the selected mode is saved in localStorage across refreshes and pages), split-flap
  boards (`createBoard`; hero events in `EVENTS`, filter by module), before/after slider,
  module scroll story, §03 sandbox (`SB_ACTIONS`: CRM deal → ERP order → HR pieces → WMS
  stock; nothing is saved), payroll receipt, quiz → configurator, floating CTA,
  lead form (`CONTACT`), industry → bundle choices, cloud/desktop choices, quiz
  back/restart, request validation and explicit delivery/copy/download
- `assets/js/tour.js` — six-module interactive product illustration, searchable
  tables, module-specific actions, metrics, keyboard-operable tabs and reset.
  Uses illustrative data in memory, makes no remote requests and stores no records.
- Icons — selected Lucide vectors are embedded as reusable SVG symbols in
  `index.html`; `assets/icons/` contains CSS check/search assets and attribution.
  All decorative uses are hidden from assistive technology, while controls keep
  their text labels. Dynamic button updates preserve the SVG and update its state.
  No icon font, external CDN or additional runtime package is required.
- Module directory and daily-control cards link to the corresponding module
  descriptions or select the matching interactive tour tab.
- Local fonts: Bricolage Grotesque and Onest (WOFF2, SIL Open Font License).
  Small labels and handwritten illustrations use system fonts. No Google Fonts
  stylesheet or external font connection is requested by visitors.
- `og-image.png` (1200×630), `favicon.svg`, `icon-512.png`, `apple-touch-icon.png`, `site.webmanifest`
- `tools/` — HTML sources for the OG image and icon; re-render with headless Chrome:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1200,630 --screenshot=og-image.png tools/og-image.html`

## Review before publishing

Check 375px mobile and desktop widths in both themes: open/close the mobile menu,
switch all six tour tabs with arrow keys, search for missing and existing records,
run each sample action and reset. In the linked sandbox, finish multiple orders,
test insufficient material, receive stock and retry. Run the quiz forward/back,
apply its recommendation, select an industry and change deployment type. Ensure
ERP includes WMS. Validate an empty form and a valid request; confirm the selected
bundle is present in the draft, and test copy, TXT and email/Telegram delivery.
The static folder sends leads to `/api/public/leads`, implemented in the platform app/backend. Route this path to the app when serving this folder separately. Override `window.FLOWCORE_LEADS_ENDPOINT` before main.js for a separate app origin, and allow the landing origin in backend `ALLOWED_ORIGINS`. See `../backend/docs/ADMIN-LEADS-2026-10-19.md` for setup. Social accounts require their own webhook configuration.

## Mobile and SEO update (2026-10-20)

- Responsive cards and timetable use shrinkable grid tracks; navigation tools stay
  at the right edge on phones. The demo table keeps its own horizontal scroll.
- Mobile navigation makes closed links inert, supports Escape and a keyboard focus
  loop, and scrolls within the available viewport in landscape. Without JavaScript,
  navigation and page content remain visible.
- Touch controls have 44px targets. Payroll sliders keep a thin visible track with
  a larger hit area; the comparison slider covers the whole comparison panel.
- Mobile search uses 16px text to avoid focus zoom on iOS. The floating demo link
  respects the bottom safe area; narrow demo metrics stack into readable rows.
- The initial phone hero appears without an entrance delay, the decorative texture
  is disabled on phones, and scroll progress updates at most once per frame.
- Search metadata is more concise, WebPage and SoftwareApplication have linked
  structured-data identifiers, and social images have text alternatives. Canonical
  URLs remain `https://flowcore.uz/`. Sitemap modification date reflects this update.
- CSS and JavaScript URLs include content hashes. Run `npm run build` after
  source changes to regenerate those URLs, static product pages and the sitemap.

Local browser checks covered widths 320, 375, 390, 430, 640, 768, 860, 861, 900,
960, 1000, 1024 and 1440px with no page-level horizontal overflow. Menu, demo search,
LMS sample payment/reset and theme switching were exercised. Production delivery,
Search Console indexing and real-device Safari still require deployment checks.

## Website form and plain Uzbek copy (2026-10-20)

The landing uses ordinary Uzbek section names with their purposes throughout
navigation, descriptions, the section picker and the submitted request. Internal
module codes and deployment values remain stable. A new visitor starts in light
mode on every page load; dark mode remains available through the theme toggle.

The public endpoint already exists in `backend/src/leads`. Its website DTO now
validates retry IDs and trims names before enforcing the minimum length.
`backend/test/website-leads.e2e-spec.ts` verifies real MongoDB persistence, admin
visibility, deduplication, preservation of admin edits, validation, origin checks
and rate limiting with isolated test MongoDB/Redis. The focused checks passed
(17 unit tests and 4 HTTP integration tests); TypeScript also passed.

See [deploy/README.md](deploy/README.md) for the same-origin nginx route or separate
app-host setup. The public form does not send cookies. The admin app and website
receiver must use the same backend. Production hostnames and server deployment
still need to be configured; a static file server alone cannot receive requests.

The updated landing was also submitted from Chrome to an isolated real NestJS
server. The authenticated admin API returned the same request with readable
section names; a fresh browser origin opened in light mode. Test data was removed.

## Build, performance and search pages (2026-10-20)

```bash
npm ci
npm run build
npm run check
```

Edit the readable CSS/JS sources under `assets/css/` and `assets/js/`, the homepage
`index.html`, and product content in `tools/products.json`. The build uses pinned
esbuild, writes minified content-hashed files to `assets/dist/`, refreshes homepage
references and creates six static product pages. Do not edit generated product
HTML or minified assets directly. `assets/manifest.json` lists the files currently
used; previous hashed files can remain during deployment so existing tabs still
load assets from the preceding release.

The product pages cover FlowCore ERP, CRM, WMS (warehouse), HR (payroll) and LMS
(education) in ordinary Uzbek. Each has a unique title, description, canonical
URL, visible product content, related links and structured data. The sitemap has
six URLs. WebSite alternateName describes the brand variant “Flow Core”; product
names appear on their relevant pages instead of being repeated as a keyword list.

Measured homepage CSS and JavaScript fell from 139,482 to 108,866 bytes (21.9%).
Their gzip size is about 30 KB when compression is enabled on the server. See
`tools/performance-summary.json` and `tools/build-report.json` for exact sizes and
measurement limits. Two local font files replace five external font families;
the main heading is visible immediately. The sandbox board is initialized near
the viewport, and the payroll counter does not animate below the fold on load.

Verification covered all six public pages, local links, anchors, metadata, JSON-LD,
sitemap membership, local fonts and generated hashes. All six product pages fit
320/768/1440px; the recommendation quiz, selection transfer and deferred sandbox
were exercised in Chrome without JavaScript errors. The previous recommendation
rendering typo is fixed. Production Core Web Vitals and search ranking have not
been measured. Configure caching/gzip with `deploy/nginx-static.conf` or `_headers`,
then submit the deployed sitemap through the verified search-console account.

## Lighthouse layout stability fix (2026-10-20)

The production mobile audit reproduced a performance score of 71 with CLS 0.53.
The no-JavaScript mobile navigation initially occupied page flow; deferred
JavaScript then switched the header to fixed positioning and moved the entire
main element. A small `has-js` marker now runs before the stylesheet. Navigation
fallback styles use that marker, while scroll reveals still initialize with the
separate `js` marker. The shared theme script propagates this fix to product pages.

The hidden draft email link now starts with `mailto:`; the existing draft renderer
sets the recipient, subject and body before showing it. This avoids presenting a
static email address for Cloudflare to rewrite and inject its blocking email
decoder. Confirm the resulting production HTML after deployment.

Two post-fix local mobile Lighthouse runs scored 97 and 94, both with CLS 0.
These are local lab measurements, not production improvements measured on the
same network. The last run measured FCP 1.8s, LCP 2.7s and TBT 140ms. See
`tools/lighthouse-summary.json` for scope and metrics. The build and six-page
integrity checks passed; Chrome verified mobile menu open/Escape close, product
layout and the local form's email fallback. No production lead was submitted.

Cloudflare's analytics beacon and `/cdn-cgi/rum` are injected by hosting and are
absent from this repository. They remain unchanged. The production audit points
to layout shift as the main failure; a request appearing in the dependency tree
does not by itself establish it as the cause. Deploy the generated HTML and new
hashed CSS together, then rerun Lighthouse on `https://flowcore.uz/`.

## Application preview (2026-10-21)

The `#ichkarida` preview follows the module sidebar labels in
`frontend/playground/shared/module-navigation.ts` and the compact workspace layout
in `frontend/playground/layouts/platform.vue`. Five module tabs expose three sample
pages each. WMS uses product, warehouse and movement tables; CRM uses a pipeline
board plus task and inbox tables; ERP, HRM and LMS expose representative lists.
Search, module navigation, reset and the existing sample actions run in memory.
No company data, authentication or API connection is used by the preview.

`assets/images/faceid-terminal.svg` is an illustrative screen based on
`faceid/src/views/TerminalView.vue` and its styles. It shows the company header,
clock, face alignment frame, arrival/departure controls and connection status.
It is labelled as a sample, uses a neutral silhouette and does not capture a face
or access the camera. It is not a live application screenshot.


## Rounded cards and light default (2026-10-21)

Shared radius tokens use 24px for large panels, 20px for cards, 14px for nested
surfaces and 12px for controls. Product pages share these tokens. Each page opens
in light mode before its first paint, ignoring previous saved theme preferences
and the operating system appearance. The theme toggle still switches the current
page; that choice is not persisted across navigation or reloads.

## Clear first visit and optional 3D (2026-10-23)

The homepage starts with a plain Uzbek product explanation, a registration-free
sample CTA and a three-step reading path. The module directory precedes the
optional event board, which now opens as a native disclosure. Headings use Onest
for consistent legibility on product pages too. Search descriptions explain the
actual tasks; the homepage FAQ schema is generated from its visible answers and
checked for parity by `npm run check`.

`assets/js/flow-scene.js` uses pinned Three.js for floating geometric forms behind the hero content.
The build bundles it into a separate content-hashed ESM file. `main.js` imports it
when the illustration approaches the viewport and the browser is idle. Data-saving
connections and devices without WebGL 2 retain the static CSS atmosphere. No CDN
is required. The background canvas is fixed, does not affect layout, is decorative and contains no
unique product information. Motion respects the system preference, can be paused,
and stops offscreen or in background tabs. GPU resources and observers are cleaned
up on page exit; back-forward cache restores are supported. Context loss restores
the CSS fallback. Three.js attribution: `assets/licenses/three-LICENSE.txt`.

Publish generated HTML and the current hashed assets together. Local checks do
not establish production Core Web Vitals or a change in search rankings.

The landing uses one fixed, viewport-wide Three.js flow scene. Two families of
smooth parallel curves run along the margins, with polished emerald conductors,
fine silver lines, junction beads and illuminated packets moving in opposite
directions. The central reading lane remains clear. Geometry is rebuilt only on
viewport resize and previous curve buffers are disposed. Material colors follow
the theme. Mobile conductors are thinner. Pause, reduced-motion and static CSS
fallback remain available.

The landing header is a floating navigation dock. Desktop links use a compact
segmented surface; at 1050px and below, a labeled menu opens numbered cards with
short explanations. Escape, outside dismissal, focus cycling, inert closed links,
scroll locking and the no-JavaScript fallback are supported. Detail-page header
structure remains independent. The cursor accent is now a small trailing ring and
dot, expanding gently over controls; the former elastic web has been removed.

The shared scene now stays behind all homepage sections, including the footer;
it is no longer clipped to the hero. Section backgrounds let the decoration show
through while cards retain solid surfaces. The pause control remains accessible
in a fixed corner. The small pointer accent also follows across the homepage.
Only one WebGL renderer is created, with viewport-sized buffers on long pages.

The former floating rings, cubes and polyhedra have been replaced by connected
flow conductors to give the decoration a consistent visual purpose. The scene
retains one viewport-sized renderer across all homepage sections.

## Sticky module clearance and scene polish (2026-10-23)

Header and module-menu dimensions are measured with ResizeObserver. The module
sidebar and horizontal sticky bar use the actual floating-header bottom plus a
12px gap. Module anchor offsets also include the horizontal bar height, keeping
headings visible when navigating directly or switching modules.

The shared 3D flow has fewer conductors, smoother tube cross-sections, explicit
antialiasing, softer reflections and viewport-edge fading. Moving packets taper
at their endpoints. Context loss stops rendering until the GPU context restores;
the static CSS fallback and normal page controls remain available.

## Five module symbols (2026-10-23)

The module directory and detailed module headings use a consistent family of
Three.js symbols: stacked cartons (WMS), a working conveyor (ERP), three team
members (HR), conversation bubbles (CRM), and an open book (LMS). Each uses a mint
platform with the established module accent. Animations are intentionally small;
ERP parcels travel, CRM bubbles float and LMS pages move slightly.

`assets/js/module-symbols.js` uses one small offscreen WebGL renderer shared by
all ten local 2D display canvases, rather than a WebGL context for every icon.
Only visible models redraw after their initial static render. The existing pause
control and reduced-motion preference stop symbol animations too. Original SVGs
remain as fallbacks. All symbol resources are disposed with the background scene.

## Motion and alternating module stories (2026-10-23)

The module descriptions now alternate copy/example columns on desktop; on mobile,
copy precedes the example. The original module sidebar stays on the left on desktop; a horizontal rail
is used on phones/tablets, with measured header and anchor clearance.

`assets/js/experience.js` bundles GSAP + ScrollTrigger and Motion's framework-free
JavaScript API. GSAP coordinates the hero entrance and once-only section reveals;
module examples enter from alternating sides on desktop and vertically on mobile.
Motion handles spring feedback on CTAs, module symbols and presses, plus menu-item
stagger. Native scrolling, navigation, focus and the existing static content remain
available. The original reveal system is the fallback if the bundle cannot load.

Reduced-motion preference or the fixed pause button removes enhanced motion and
reveals all content. Media changes revert inline styles and listeners. Disclosures
refresh ScrollTrigger positions; page exit releases the animation context. The
experience bundle is separate from the shared Three.js bundle and uses local files.

## Particle atmosphere (2026-10-23)

The background conductors were replaced with a GPU-driven particle atmosphere:
two gently undulating point fields and soft moving light washes frame the page.
Vertex shaders move the points without per-frame buffer uploads; mobile uses
912 points versus 2560 on desktop. The center stays clear for text. Theme-aware
colors, subtle pointer depth, global pause/reduced-motion and the full-page fixed
canvas remain. Module symbols, Motion/GSAP interactions and navigation are kept.

## Flow ribbons background (2026-11-13)

`assets/js/flow-ribbons.js` replaced the wireframe cube networks and point columns.
Four translucent silk ribbons (threaded lines, a light pulse travelling along each)
sweep across the page with particles flowing along them, all moved in the vertex
shader. Scroll drives the motion: each ribbon drops from the top, then flattens,
pleats and settles onto a neat stack near the bottom before fading while the next
one falls in; scrolling back reverses it. The center column is dimmed for text,
the pointer gently bulges the ribbons, dark mode uses additive glow and light mode
normal blending. Ribbon/particle density follows the device tier; phones use
fewer particles and three ribbons on mid/low devices.


## Stacked sections (2026-11-13)

`assets/js/stack-scroll.js` (home, module and legal pages) turns every `main > section`
into a card. A section sticks once its end reaches the viewport bottom (`--stack-top`)
and the next one slides over it; the covered one shrinks, rises slightly and fades
(`--stack-p`), and becomes `visibility: hidden` when fully covered. Layout heights do
not change. Because stuck sections report shifted positions, measurements use
`window.flowcoreStack.naturalTop()` (the `stack-measure` class unsticks them inside one
synchronous call); ScrollTrigger adds that class during refresh, the assembly intro
uses it, and same-page anchors scroll to the natural place (`#aloqa` stays with
main.js). Reduced motion keeps the stacking without the scale.


### Product preview and motion (2026-11-05)

The landing preview mirrors the FlowCore module navigation, workspace palette,
Inter font, table columns and chart presets. Six modules contain 44 views. The
fictional reports include 48 KPIs and 35 populated charts. `demo-report-charts.js`
mirrors the frontend shared report-chart aggregation and presets;
`demo-reports.js` supplies deterministic demonstration records, and
`demo-dashboard.js` renders the report cards, charts and searchable data explorer.
`tour.js` is bundled so those helpers share one content-hashed asset.

Demonstration dialogs do not implement business workflows. Report period inputs
show the fixed sample period; export controls explain that the full application
provides export. No production API or authenticated company data is used.

The module directory loops continuously over six cards in an 85-second CSS
marquee. GSAP adds ongoing decorative motion and repeats section entrances on
return scroll. Motion respects the OS reduced-motion preference; background-tab
ambient animations pause. The former motion pause button was removed.
The event-board disclosure has an explicit open/close label and rotating chevron.

## SEO identity and indexing (2026-11-10)

`tools/seo.mjs` is the source of official social profiles: Telegram
`https://t.me/flowcoreuz` and Instagram `https://www.instagram.com/flowcore_uz`
(user supplied). Homepage Organization JSON-LD and generated page footers use
these same links. The logo is the existing 512×512 `/icon-512.png`; there is no
`/logo.png`. Organization, WebSite, WebPage, software and FAQ entities are linked
by stable IDs. Unverified release versions and a social card incorrectly marked
as an application screenshot were removed. No invented ratings or prices are
published to obtain rich results.

Module titles and H1s describe the actual search intent (CRM, production ERP,
warehouse accounting, payroll/attendance, education and POS). FAQ markup follows
the visible answers; it does not promise a FAQ rich result. Sitemap lastmod now
changes when the generated page changes, and remains stable on an identical
rebuild. CI checks sitemap drift too. `npm run check` checks the organization
logo/profiles, page/schema parity and product FAQ parity in addition to existing
canonical, hreflang, link and asset checks.

After publishing, validate the homepage and a product URL in Google's Rich
Results Test, then inspect the deployed canonical URLs in the verified Search
Console property. Submit `https://flowcore.uz/sitemap.xml`. Track impressions,
clicks, queries and indexed URLs before deciding which product guides or case
studies to add. Build checks are local integrity checks; they do not establish
Google indexing, rich-result eligibility or improved rankings. Search Console
submission requires the owner's verified account and has not been performed by
this repository change.


## Demo layout and charts (2026-11-11)

The demo uses the landing page scroll, with an automatic height on desktop and mobile.
There is no nested vertical report, sidebar or bar-chart scroll area. Wide data tables
retain horizontal scrolling. Mobile sidebar links wrap across rows.

Reports initially display two charts; a button expands or collapses the remaining
charts, and report tables live in a native details disclosure. Existing records and
aggregation are preserved. SVG line charts include area shading and data markers;
donut segments have separation and readable legends. All chart types use a shared,
theme-aware palette. Line-chart keyboard controls and chart data tables remain available.


## Scroll assembly opening (2026-11-11)

The homepage begins with seven scattered 3D module miniatures (CRM, ERP, HRM, WMS,
LMS, POS and Moliya). A native sticky section maps page scroll to their convergence;
a 3D FlowCore tile and HTML wordmark emerge at the center before the lower content
continues. Reverse scrolling reverses the assembly. No wheel, touch, or scroll-lock
handlers are used; the “Davom etish” link bypasses the sequence.

A lightweight controller in main.js drives the sticky section and progress before
the optional WebGL bundle loads. Reduced-motion users see the assembled brand without
the long scroll. When WebGL is unavailable, HTML module labels converge and reveal
the SVG brand tile and wordmark using the same progress. Body overflow-x uses clip
so it does not create an accidental scrolling ancestor that breaks sticky positioning. Scene geometry/materials and scroll
listeners are released on cleanup. Desktop/mobile visual and touch-device QA remain
to be completed because active user browser interaction interrupted the UI checks.


The actual main.js assembly controller was checked locally with and without
motion reduction, confirming scatter,
convergence, final brand reveal, reverse scroll and progress events without WebGL.
This is controller verification; native browser visual inspection was interrupted
by concurrent activity in Chrome, and the DOM browser adapter also failed.


### Assembly motion refinement (2026-11-11)

The seven modules now follow deterministic curved paths into separate sockets within
the brand tile. They retain their shape during approach and dissolve during the
brand build, rather than shrinking to a zero-size point. The tile, F strokes and
dot settle in stages, with a gentle camera approach and a clear final hold. A three-step
indicator follows scroll progress. HTML fallback paths also curve toward the center;
forward/reverse scrolling and reduced-motion behavior remain intact.

The exported `assemblyPose` calculation was checked at 1,000 samples for each of
seven modules: finite coordinates, continuity, monotonic opacity and complete
convergence within the logo bounds. Controller regression, build, lint and site
checks passed; browser visual QA remains limited by concurrent Chrome activity.


### Exact brand and result copy (2026-11-11)

User rejected a recreated 3D logo and requested an exact match to the existing brand.
The final assembly now uses the same inline SVG shapes, stroke attributes and colors
as the header, with the same Onest wordmark font. The approximate extruded logo was
removed; module miniatures remain 3D. Initial module scale increased by 40% and their
positions moved inward to retain framing. The progress bar was removed. Three short
explanations appear after assembly: unified accounts, connected modules and staff
permissions. Reduced motion and the SVG-only assembly continue to work.

Validation compares header/final SVG geometry and colors, checks absence of the bar,
and exercises controller forward/reverse behavior; build/lint/site/HTTP pass. This
supersedes earlier README notes describing an extruded final logo or a progress bar.

## Assembly scene polish (2026-11-13)

The "01 Modullar / 02 Birlashish / 03 FlowCore" step indicator was removed from
the opening (markup, styles and its scroll handler). The WebGL assembly in
`assets/js/connected-scene.js` now spirals every module into the core (`assemblyPose`
stays deterministic for forward/reverse scroll), leaves short colour trails while
the page is scrolled, draws a dust vortex that is pulled in and released as a burst,
grows an energy core (glow, wireframe lattice, three gyroscope rings) and sends two
shockwave rings as the exact SVG mark appears. Data packets now flow from the
departments into the core. Checked in Chrome at desktop width, light and dark;
mobile and low-end GPU performance were not measured.

## Performance tiers, opening caption and demo height (2026-11-13)

- `assets/js/quality.js` picks one profile per device (`high`/`mid`/`low` from pointer type,
  width, CPU cores, device memory, data saver and the GPU name). Software WebGL
  (SwiftShader/llvmpipe) mounts no WebGL at all and keeps the HTML/CSS fallback; every
  renderer also uses `failIfMajorPerformanceCaveat`. The profile sets pixel ratio,
  antialiasing, shadows (high only), physical vs standard materials, particle count,
  trails and frame budgets. `createGovernor` lowers the drawing-buffer resolution when
  frames stay slow and raises it again when they recover.
- Assembly scene: each miniature is merged into one mesh per material (draw calls drop
  from hundreds to a few dozen), packets and trails are `InstancedMesh`, label positions
  are written only while labels are visible, scroll events no longer render twice, the
  loop runs at full rate only while scrolling and stops once the final mark holds.
- Background scene and module symbols follow the same profile (background capped at
  1.25x, fewer points on weaker devices; symbols render once on `low`).
- The opening caption row ("Modullarni birlashtirish uchun pastga scroll qiling" and
  "Davom etish") was removed with its styles and script.
- "Dastur qanday ishlashini sinab ko‘ring": the demo window now has an app-like height
  (`clamp(540px, 100svh - 150px, 760px)`); its page scrolls inside the window and resets
  to the top on module/section change. Phones cap the content at `min(600px, 72svh)`.
  The section went from 3390px to about 2080px at a 700px-high desktop window.
- Checked in Chrome at desktop and 500px width: no console errors, no long tasks while
  scrolling the opening, no horizontal overflow. Real low-end phones were not tested.

## Lighthouse 100, languages and search (2026-11-14)

Goal: Lighthouse 100 in every category on mobile and desktop, and better search and
AI-assistant visibility for "FlowCore", "FlowCore ERP/CRM/AI/…" in Uzbek, English and Russian.

Performance (mobile TBT was 1.3 s):
- The hero WebGL scene and the GSAP/motion layer (`experience.*.js`) load on the first real
  input (pointer, touch, wheel, key). `scroll` is not a trigger: Chrome fires it during load.
  The motion layer mounts only after scrolling settles, because creating ScrollTriggers
  restores the scroll position and would cancel a smooth anchor jump.
- Sections from the 4th onward use `content-visibility: auto`. On the first input
  `stack-scroll.js` adds `.stack-render-all`, so anchors, sticky offsets and ScrollTrigger
  positions use real sizes afterwards. Anchor clicks and `#aloqa` force it too.
- Stack and assembly measurements are batched into one animation frame; card heights are read
  without the unstuck relayout; the stack fade starts at a card's stuck edge (a short first
  screen is no longer dimmed).
- Accessibility: contrast tokens (`--ink-3`, `--ok`, `.t-label`), names for the logo, menu,
  reset button and ✓/✗ cells.

Search and languages:
- `/en/` and `/ru/` overview and product pages from `tools/i18n.mjs` (generator
  `tools/generate-i18n.mjs`); every home/product page links uz/en/ru with hreflang,
  `x-default` is Uzbek. The application itself stays Uzbek.
- New `/ai/` page (FlowCore AI: module AI analysts, own AI key, MCP).
- Product pages show a real screen of the demo company (`assets/images/screens/*.webp`,
  640px variants for phones) and their own OG card (`assets/images/og/*.jpg`); regenerate with
  `tools/capture-screens.mjs`.
- `sitemap.xml` carries hreflang alternates and images; `llms.txt` (built from the same data)
  summarises FlowCore for AI assistants; `robots.txt` explicitly allows AI crawlers.
- `tools/check-site.py` now accepts uz/en/ru pages and checks sitemap hreflang and images.

Off-site steps that the code cannot do: submit the sitemap in Google Search Console and Yandex
Webmaster, request indexing of `/en/`, `/ru/` and `/ai/`, and keep the Telegram/Instagram
profiles linking to flowcore.uz.

## Platform look (2026-11-14)

Requested direction: close to iotics.uz in structure, built only from FlowCore's own product.
- Dark navy-green is the default theme (`data-theme="dark"`, tokens at the end of
  `assets/css/style.css`); the toggle and a saved choice still switch to light.
- Hero is two columns: brand, headline, CTAs and four fact cards (7 modules, 3 ways to run,
  2 mobile apps, 5+ AI providers) next to a still render of our own 3D furniture factory
  (`assets/images/hero/factory-hero*.webp`, rendered from `factory-scene.js` with a transparent
  background) with module badges linked to their pages. The scroll assembly section now follows
  the hero.
- `#modullar` opens with a module grid built from `tools/products.json`: hovering or focusing a
  card shows that module's real screen and points in the large panel.
- The home header has a UZ/EN/RU language menu; generated pages have the UZ/EN/RU switch.
- Kept fast: no `filter`/`backdrop-filter` on the hero (paint cost on phones), the hero image is
  preloaded with 520/760/1400 widths, and sections from the third one skip rendering
  (`.has-js main > section:nth-child(n+3)`) so the demo font (Inter, 350 KB) is not fetched at load.
- A fixed bottom section-progress bar was tried and removed at the user's request.
