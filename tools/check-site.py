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
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.canonicals, self.descriptions = [], [], [], []
        self.h1 = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.descriptions.append(attrs.get('content'))
        if tag == 'meta' and attrs.get('name') == 'robots':
            assert 'noindex' not in attrs.get('content', ''), 'Public page disallows indexing'
        for key in ['href', 'src']:
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

assert len(set(titles)) == len(titles), 'Duplicate search titles'
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
print(f'PASS: {len(files)} crawlable pages, unique titles, canonical URLs, links, sitemap, JSON-LD, local fonts and asset hashes')
