import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Proxy middleware that fetches URLs and strips X-Frame-Options / CSP headers
function proxyMiddleware() {
  return {
    name: 'vyom-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy', (req, res) => {
        const params = new URLSearchParams(req.url.replace(/^.*\?/, ''));
        const target = params.get('url');

        if (!target) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing ?url= parameter');
          return;
        }

        let parsedUrl;
        try {
          parsedUrl = new URL(target);
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid URL');
          return;
        }

        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
          },
          rejectUnauthorized: false,
        };

        const proxyReq = lib.request(options, (proxyRes) => {
          // Strip headers that block iframe embedding
          const filteredHeaders = { ...proxyRes.headers };
          delete filteredHeaders['x-frame-options'];
          delete filteredHeaders['content-security-policy'];
          delete filteredHeaders['content-security-policy-report-only'];
          delete filteredHeaders['x-content-type-options'];
          filteredHeaders['access-control-allow-origin'] = '*';

          // Handle redirects
          if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
            let redirectUrl = proxyRes.headers.location;
            if (redirectUrl.startsWith('/')) {
              redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
            }
            res.writeHead(302, { Location: `/proxy?url=${encodeURIComponent(redirectUrl)}` });
            res.end();
            return;
          }

          // Rewrite absolute URLs in HTML so links also go through the proxy
          if ((filteredHeaders['content-type'] || '').includes('text/html')) {
            delete filteredHeaders['content-length'];
            res.writeHead(proxyRes.statusCode, filteredHeaders);

            let body = '';
            proxyRes.setEncoding('utf8');
            proxyRes.on('data', (chunk) => (body += chunk));
            proxyRes.on('end', () => {
              const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
              const injectScript = `
                <script>
                  window.addEventListener('DOMContentLoaded', () => {
                    document.body.addEventListener('click', (e) => {
                      const a = e.target.closest('a');
                      if (a && a.href && !a.href.startsWith('javascript:')) {
                        e.preventDefault();
                        let targetUrl = a.href;
                        if (targetUrl.includes('duckduckgo.com/l/?uddg=')) {
                          try {
                            const urlParams = new URLSearchParams(targetUrl.split('?')[1]);
                            if (urlParams.has('uddg')) {
                              targetUrl = decodeURIComponent(urlParams.get('uddg'));
                            }
                          } catch(err) {}
                        }
                        window.location.href = '/proxy?url=' + encodeURIComponent(targetUrl);
                      }
                    });
                    document.body.addEventListener('submit', (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const fd = new FormData(form);
                      const params = new URLSearchParams();
                      for (const [k, v] of fd.entries()) params.append(k, v);
                      
                      let action = form.action || window.location.href;
                      const url = action + (action.includes('?') ? '&' : '?') + params.toString();
                      window.location.href = '/proxy?url=' + encodeURIComponent(url);
                    });
                  });
                </script>
              `;
              
              // Rewrite meta refresh tags to also go through the proxy
              body = body.replace(/<meta\s+http-equiv=["']refresh["']\s+content=["']([^;]+);\s*url=([^"']+)["']/gi, (match, p1, p2) => {
                let parsedRedirect = p2;
                if (parsedRedirect.startsWith('/')) {
                   parsedRedirect = `${parsedUrl.protocol}//${parsedUrl.host}${parsedRedirect}`;
                }
                return `<meta http-equiv="refresh" content="${p1}; url=/proxy?url=${encodeURIComponent(parsedRedirect)}">`;
              });
              
              // Rewrite base tag or add one so relative paths resolve correctly
              if (body.match(/<head([^>]*)>/i)) {
                body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">${injectScript}`);
              } else if (body.match(/<body([^>]*)>/i)) {
                body = body.replace(/<body([^>]*)>/i, `<body$1><base href="${origin}/">${injectScript}`);
              } else if (body.match(/<html([^>]*)>/i)) {
                body = body.replace(/<html([^>]*)>/i, `<html$1><head><base href="${origin}/">${injectScript}</head>`);
              } else {
                body = `<base href="${origin}/">${injectScript}` + body;
              }
              res.end(body);
            });
          } else {
            res.writeHead(proxyRes.statusCode, filteredHeaders);
            proxyRes.pipe(res);
          }
        });

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/html' });
            res.end(`<html><body style="background:#111;color:#eee;font-family:sans-serif;padding:2rem">
              <h2>502 - Could not connect</h2>
              <p>${err.message}</p>
            </body></html>`);
          }
        });

        proxyReq.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), proxyMiddleware()],
  server: {
    port: 3000,
    host: true,
  }
});
