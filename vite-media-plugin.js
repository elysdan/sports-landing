import { dispatchApiRoute } from './backend/router.js';

export default function mediaPlugin() {
  return {
    name: 'file-upload-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const isHandled = await dispatchApiRoute(req, res);
          if (isHandled) return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        next();
      });
    }
  };
}
