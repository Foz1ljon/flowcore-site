# FlowCore landing page

Static site (HTML + CSS + vanilla JS), no build step. Deploy the folder as-is
(nginx, Cloudflare Pages, Vercel, GitHub Pages).

```bash
python3 -m http.server 8080   # local preview → http://localhost:8080
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

- `index.html` — page, meta/OG/Twitter tags, JSON-LD (Organization, WebSite,
  SoftwareApplication, FAQPage)
- `assets/css/style.css` — light/dark tokens at the top (`:root`, `[data-theme]`). Brand colours
  follow the app: emerald `#10b981` (`frontend/playground/shared/brand.ts`), logo `#064e3b` /
  `#6ee7b7`, zinc neutrals; logo SVG from `frontend/playground/public/brand/`. One colour per module (`--c-wms` … `--c-lms`); respects `prefers-reduced-motion`
- `assets/js/main.js` — theme toggle (saved in `localStorage` as `fc-theme`), split-flap
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
- Fonts (Google Fonts): Bricolage Grotesque, Onest, JetBrains Mono, Caveat
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
- CSS and JavaScript URLs include content hashes. Refresh these query hashes after
  changing assets to avoid clients reusing old cached files.

Local browser checks covered widths 320, 375, 390, 430, 640, 768, 860, 861, 900,
960, 1000, 1024 and 1440px with no page-level horizontal overflow. Menu, demo search,
LMS sample payment/reset and theme switching were exercised. Production delivery,
Search Console indexing and real-device Safari still require deployment checks.
