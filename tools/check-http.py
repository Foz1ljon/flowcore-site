"""Check real static routes, custom 404 status and error-page asset URLs."""
import argparse
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://127.0.0.1:8080')
base = parser.parse_args().base_url.rstrip('/')


def fetch(path, method='GET'):
    url = base + path
    try:
        response = urlopen(Request(url, method=method), timeout=10)
    except HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read(), response.url


for path in ['/', '/privacy/', '/terms/', '/erp/']:
    assert fetch(path)[0] == 200, (path, 'Existing page stopped working')


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.urls.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in {'stylesheet', 'preload'}:
            self.urls.append(attrs['href'])


for path in ['/missing-page-test', '/missing/deep/page?source=test', '/404.html']:
    status, headers, body, final_url = fetch(path)
    assert status == 404, (path, 'Expected HTTP 404', status)
    assert final_url == base + path, (path, 'Unexpected redirect', final_url)
    assert 'noindex' in headers.get('X-Robots-Tag', ''), (path, 'Missing noindex header')
    text = body.decode('utf-8')
    assert 'Bu sahifa topilmadi.' in text and 'Bosh sahifaga qaytish' in text
    head_status, _, head_body, _ = fetch(path, 'HEAD')
    assert head_status == 404 and not head_body, (path, 'HEAD status/body mismatch')
    assets = Assets()
    assets.feed(text)
    for asset in assets.urls:
        assert asset.startswith('/'), ('Error-page asset must be root-relative', asset)
        with urlopen(urljoin(base + path, asset), timeout=10) as response:
            assert response.status == 200, ('Broken error-page asset', asset)

assert fetch('/assets/missing-file.css')[0] == 404
print('PASS: existing pages, missing/nested routes, preserved URL, GET/HEAD 404, noindex and assets')
