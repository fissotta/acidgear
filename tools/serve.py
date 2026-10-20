#!/usr/bin/env python3
"""Servidor local para probar ACID GEAR sin Node: python3 tools/serve.py  →  http://localhost:8000"""
import http.server, os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache'); super().end_headers()
print(f'ACID GEAR en http://localhost:{port}  (Ctrl+C para salir)')
http.server.ThreadingHTTPServer(('0.0.0.0', port), H).serve_forever()
