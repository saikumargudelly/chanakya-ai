const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for /api routes
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying API request:', req.method, req.url, 'to', proxyReq.path);
      },
      onError: function(err, req, res) {
        console.error('API Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('API Proxy error: ' + err.message);
      }
    })
  );

  // Proxy for /chat route
  app.use(
    '/chat',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/chat': '/api/chat'  // Rewrite /chat to /api/chat
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying chat request:', req.method, req.url, 'to', proxyReq.path);
      },
      onError: function(err, req, res) {
        console.error('Chat Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Chat Proxy error: ' + err.message);
      }
    })
  );
}; 