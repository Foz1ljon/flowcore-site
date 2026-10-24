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
- `assets/js/tour.js` — five-module interactive product illustration, searchable
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
switch all five tour tabs with arrow keys, search for missing and existing records,
run each sample action and reset. In the linked sandbox, finish multiple orders,
test insufficient material, receive stock and retry. Run the quiz forward/back,
apply its recommendation, select an industry and change deployment type. Ensure
ERP includes WMS. Validate an empty form and a valid request; confirm the selected
bundle is present in the draft, and test copy, TXT and email/Telegram delivery.
The static folder sends leads to `/api/public/leads`, implemented in the platform app/backend. Route this path to the app when serving this folder separately. Override `window.FLOWCORE_LEADS_ENDPOINT` before main.js for a separate app origin, and allow the landing origin in backend `ALLOWED_ORIGINS`. See `../docs/ADMIN-LEADS-2026-10-19.md` for setup. Social accounts require their own webhook configuration.

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
references and creates five static product pages. Do not edit generated product
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
sitemap membership, local fonts and generated hashes. All five product pages fit
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

## Connected FlowCore background (2026-10-24)

`assets/js/flow-network.js` adds two decorative 3D department networks to the
existing atmosphere. Five colored cubes connect to a central core; packets travel
along curved paths to suggest information moving between modules. Networks sit in
the viewport margins, use smaller geometry/fewer visible packets on phones, and
share the existing renderer, theme, pause/reduced-motion handling and cleanup.
