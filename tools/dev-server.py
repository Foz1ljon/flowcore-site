"""Serve the landing locally with the same branded 404 response as production."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class LandingHandler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        page = ROOT / '404.html'
        if code != 404 or not page.is_file():
            return super().send_error(code, message, explain)
        content = page.read_bytes()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Robots-Tag', 'noindex')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(content)

    def send_head(self):
        if unquote(urlsplit(self.path).path) == '/404.html':
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    handler = partial(LandingHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'FlowCore dev: http://127.0.0.1:{args.port} (custom 404 enabled)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
