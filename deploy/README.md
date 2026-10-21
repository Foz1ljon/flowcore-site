# Landing website lead delivery

## Production 404 and origin rejection

An nginx HTML 404 at `POST https://flowcore.uz/api/public/leads` means the
landing virtual host is not forwarding the form to NestJS. Changing the form
to the dashboard or gateway URL alone does not repair this: both currently
reject `Origin: https://flowcore.uz` with HTTP 403 (checked 2026-10-21).

One-time root setup on the shared host (204.168.251.7) installs
[nginx.conf](nginx.conf) as the `flowcore.uz` vhost (replacing the old
static-only block, with `www` redirected to the apex), installs both snippets,
hands `/var/www/flowcore-site` to the `deploy` user and adds
`https://flowcore.uz` to backend `ALLOWED_ORIGINS`:

```sh
scp -r deploy root@204.168.251.7:/tmp/flowcore-landing-deploy
ssh root@204.168.251.7 bash /tmp/flowcore-landing-deploy/server-setup.sh
```

The script restores the previous vhost if `nginx -t` fails and ends with a
routing check that should print 400. Rerun it after changing a file in `deploy/`.

## Continuous deployment

`.github/workflows/deploy.yml` runs on every push to `main`: it rebuilds and fails
if committed generated files are stale, runs `npm run check`, uploads the public
files with rsync (no `tools`, `deploy`, package or README files; previous hashed
assets are kept; HTML is uploaded last), then checks that the home page, favicons,
manifest and sitemap return 200 and the lead route returns 400. Repository secrets
are the same as the frontend/backend repos: `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`.

Check routing without creating a lead:

```sh
curl -i https://flowcore.uz/api/public/leads \
  -H 'Origin: https://flowcore.uz' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

Expect HTTP 400 with JSON validation errors. HTML 404 means the virtual host
still misses the proxy; JSON 403 means the origin is not allowed; 502 means
NestJS is not reachable on the configured port. Then submit one identifiable
test lead from the actual form and verify it in the superadmin leads list.

The home and product pages now advertise square PNG favicons (16, 32, 48 and
96 pixels), an ICO fallback, and the existing 180px Apple icon. Check the new
icon URLs return HTTP 200 and image content types. If Cloudflare still serves
a cached 404 for `/favicon.ico`, purge that URL. Google must recrawl the home
page before its search icon can update; request indexing in Search Console.
Google does not guarantee when or whether an icon is displayed. See
[Google's favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search).

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

The config also returns 404 for `.git`, `tools/`, `deploy/`, `node_modules/`,
`README.md` and package files, and redirects `/index.html` URLs to their
directory URL. Serve `www.flowcore.uz` only as a 301 redirect to
`https://flowcore.uz` (server block at the end of `nginx-static.conf`, or a
Cloudflare redirect rule), so search engines index one host. Better still,
deploy only the public files (HTML, `assets/`, icons, `robots.txt`,
`sitemap.xml`, `site.webmanifest`) instead of the whole repository checkout.

The sitemap includes `/`, `/erp/`, `/crm/`, `/ombor/`, `/ish-haqi/`, and `/talim/`.
Submit `https://flowcore.uz/sitemap.xml` to Google Search Console and Yandex
Webmaster after deployment and domain verification. Use URL inspection to request
recrawling of the changed pages. Titles and useful page content support relevant
queries, but indexing and ranking are decided by the search engine. No Search
Console account has been connected and no indexing request has been submitted.
