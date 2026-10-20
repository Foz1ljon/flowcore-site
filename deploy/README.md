# Landing website lead delivery

The form submits JSON to `POST /api/public/leads` without login. The NestJS
receiver saves platform sales leads in MongoDB. The superadmin sees them at
`/admin?tab=leads`, with source `website` and initial status `new`.

## Static landing and app on the same server

1. Include `nginx-leads.conf` inside the landing domain's HTTPS `server` block.
   Change the loopback upstream port only if NestJS listens on another port.
2. Add the exact HTTPS landing origin to backend `ALLOWED_ORIGINS`, retaining
   the app origin. Example: `https://flowcore.uz,https://app.example.com`.
3. Keep backend `TRUST_PROXY=loopback` when nginx connects over loopback.
4. The admin app's `NUXT_BACKEND_URL` must point to this same NestJS instance.
5. Validate nginx configuration, reload nginx, and restart the backend when its
   environment changes. Deploy the backend lead files as well as the landing.

Only the public form endpoint is exposed by this snippet. It does not expose
admin endpoints from the static site. Browser success is shown only after the
backend responds with JSON `{ "ok": true }`.

## Landing and app on different servers

Set the public app endpoint before the main script in `index.html`:

```html
<script>
  window.FLOWCORE_LEADS_ENDPOINT = 'https://app.example.com/api/public/leads';
</script>
```

Replace `app.example.com` with the real app host. Add the landing origin to
backend `ALLOWED_ORIGINS`. The hosted Nuxt app proxies this endpoint to NestJS;
keep `NUXT_BACKEND_URL` configured. No token or admin password belongs in the
landing. The standalone Python static preview does not provide this API.

## Verification

Submit a request from the deployed landing, log in as superadmin, and open
`/admin?tab=leads`. Confirm name, phone, company and selected sections. A network
retry must keep one lead. Anonymous visitors and tenant users cannot list leads.
The backend rejects malformed input, unknown fields and untrusted origins and
allows at most ten website submissions per IP in ten minutes.

## Static delivery and search pages

Deploy the generated `assets/dist/` directory, local `assets/fonts/`, and all five
product folders with the homepage. Include `nginx-static.conf` in the landing
HTTPS server alongside `nginx-leads.conf`, replacing an existing static
`location /` block. It enables gzip, immutable caching for content-hashed assets,
and revalidation for HTML. Run `nginx -t` before reloading. The nginx configuration
is a deployment example; it has not been applied to the production server.

`_headers` supplies equivalent asset-cache headers on hosts that support that file
(such as Cloudflare Pages or Netlify). On other hosts, configure caching and gzip
in the hosting settings. Keep API responses uncached.

The sitemap includes `/`, `/erp/`, `/crm/`, `/ombor/`, `/ish-haqi/`, and `/talim/`.
Submit `https://flowcore.uz/sitemap.xml` to Google Search Console and Yandex
Webmaster after deployment and domain verification. Use URL inspection to request
recrawling of the changed pages. Titles and useful page content support relevant
queries, but indexing and ranking are decided by the search engine. No Search
Console account has been connected and no indexing request has been submitted.
