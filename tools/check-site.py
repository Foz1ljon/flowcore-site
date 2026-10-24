"""Validate public pages, crawlable links, metadata and generated asset integrity."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import collections
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'assets/manifest.json').read_text())
files = ['index.html', *manifest['pages']]

class Page(HTMLParser):
    def __init__(self, allow_noindex=False):
        super().__init__()
        self.ids, self.links, self.canonicals, self.descriptions = [], [], [], []
        self.h1 = 0
        self.lang = None
        self.alternates = {}
        self.allow_noindex = allow_noindex
        self.robots = ''
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag == 'link' and attrs.get('rel') == 'alternate' and attrs.get('hreflang'):
            code = attrs['hreflang']
            assert code not in self.alternates, ('Duplicate hreflang', code)
            self.alternates[code] = attrs.get('href')
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.descriptions.append(attrs.get('content'))
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots = attrs.get('content', '')
            if not self.allow_noindex:
                assert 'noindex' not in self.robots, 'Public page disallows indexing'
        for key in ['href', 'src', 'data-scene-src']:
            if key in attrs:
                self.links.append(attrs[key])

pages, canonicals, titles = {}, [], []
for filename in files:
    source = (ROOT / filename).read_text()
    page = Page()
    page.feed(source)
    assert page.h1 == 1, (filename, 'Expected one H1')
    assert not [key for key, count in collections.Counter(page.ids).items() if count > 1], (filename, 'Duplicate IDs')
    assert len(page.canonicals) == 1 and len(page.descriptions) == 1, (filename, 'Missing/duplicate metadata')
    assert page.descriptions[0], (filename, 'Empty description')
    expected = 'https://flowcore.uz/' + ('' if filename == 'index.html' else filename.removesuffix('index.html'))
    assert page.canonicals[0] == expected, (filename, 'Incorrect canonical')
    canonicals.extend(page.canonicals)
    titles.append(re.search(r'<title>(.*?)</title>', source, re.S)[1])
    for match in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
        graph = json.loads(match[1])
        assert graph['@context'] == 'https://schema.org'
        assert any(item['@type'] == 'WebPage' for item in graph['@graph'])
    assert not re.search(r'(?:href|src)="https://fonts\.(?:googleapis|gstatic)\.com', source), (filename, 'External render dependency')
    pages[filename] = page

# Search answers must match the text visitors can actually read.
home_source = (ROOT / 'index.html').read_text()
faq_source = re.search(r'<div class="faq">(.*?)</div>', home_source, re.S)[1]
def plain(text):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', '', text)).strip()
visible_faq = [(plain(re.sub(r'<span>.*?</span>', '', q)), plain(a))
    for q, a in re.findall(r'<summary>(.*?)</summary>\s*<p>(.*?)</p>', faq_source, re.S)]
home_graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', home_source, re.S)[1])
search_faq = next(node for node in home_graph['@graph'] if node['@type'] == 'FAQPage')['mainEntity']
assert len(visible_faq) >= 10, 'Homepage FAQ extraction is incomplete'
assert visible_faq == [(q['name'], q['acceptedAnswer']['text']) for q in search_faq], 'Search FAQ differs from visible answers'

assert len(set(titles)) == len(titles), 'Duplicate search titles'
by_canonical = {page.canonicals[0]: page for page in pages.values()}
for filename, page in pages.items():
    assert page.lang == 'uz', (filename, 'Public pages must remain Uzbek')
    assert set(page.alternates) <= {'uz', 'x-default'}, (filename, 'Unexpected translated page alternate')
    assert page.alternates.get(page.lang) == page.canonicals[0], (filename, 'Missing self hreflang')
    for language, url in page.alternates.items():
        assert url in by_canonical, (filename, 'Hreflang points to a missing page', url)
        target = by_canonical[url]
        if language != 'x-default':
            assert target.lang == language, (filename, 'Hreflang points to the wrong language', language)
            assert target.alternates.get(page.lang) == page.canonicals[0], (filename, 'Missing reciprocal hreflang', url)
    for path in ['/privacy/', '/terms/']:
        assert path in page.links, (filename, 'Missing legal page link', path)
for filename in manifest.get('errorPages', []):
    error = Page(allow_noindex=True)
    error.feed((ROOT / filename).read_text())
    assert error.h1 == 1 and error.lang == 'uz', (filename, 'Invalid error page structure')
    assert 'noindex' in error.robots and not error.canonicals, (filename, 'Error page must not be indexed or canonicalised')
    assert not [key for key, count in collections.Counter(error.ids).items() if count > 1], (filename, 'Duplicate IDs')
    assert '/' in error.links and '/privacy/' in error.links and '/terms/' in error.links, (filename, 'Missing recovery links')
    pages[filename] = error
for filename, page in pages.items():
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc:
            continue
        path = unquote(parsed.path)
        if not path:
            target = ROOT / filename
        elif path.startswith('/'):
            target = ROOT / path.lstrip('/')
        else:
            target = (ROOT / filename).parent / path
        if target.is_dir():
            target /= 'index.html'
        assert target.is_file(), (filename, 'Broken local link', link)
        if parsed.fragment:
            key = target.relative_to(ROOT).as_posix()
            if key in pages:
                assert unquote(parsed.fragment) in pages[key].ids, (filename, 'Broken anchor', link)

for path in manifest['assets'].values():
    content = (ROOT / path).read_bytes()
    digest = hashlib.sha256(content).hexdigest()[:12]
    assert digest in Path(path).name, ('Stale content hash', path)
    if path.endswith('.css'):
        for url in re.findall(r'url\(["\']?([^\s)"\']+)', content.decode()):
            if not url.startswith(('data:', '#', '%23')):
                assert ((ROOT / path).parent / url).is_file(), ('Broken CSS asset', path, url)
for font in (ROOT / 'assets/fonts').glob('*.woff2'):
    assert font.read_bytes().startswith(b'wOF2'), ('Invalid font', font)
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = ET.parse(ROOT / 'sitemap.xml')
assert sorted(node.text for node in sitemap.findall('s:url/s:loc', ns)) == sorted(canonicals), 'Sitemap differs from public pages'
assert 'Sitemap: https://flowcore.uz/sitemap.xml' in (ROOT / 'robots.txt').read_text()
print(f'PASS: {len(files)} crawlable pages, unique titles, canonicals, reciprocal hreflang, legal links, sitemap, JSON-LD, fonts and asset hashes')
