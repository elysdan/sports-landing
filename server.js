import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dispatchApiRoute } from './backend/router.js';
import { sendJson } from './backend/utils.js';
import { ensureDb } from './db.js';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg'
};

const server = http.createServer(async (req, res) => {
  try {
    // 1. API: Centralized clean architecture router dispatcher
    const isHandled = await dispatchApiRoute(req, res);
    if (isHandled) return;
  } catch (err) {
    sendJson(res, 500, { error: err.message });
    return;
  }

  // 2. Static File Server & Client-side routing fallback
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  let filePath = '';
  if (pathname.startsWith('/update/')) {
    // Dynamic uploads folder
    const relativePath = pathname.replace(/^\/update\//, '');
    filePath = path.join(process.cwd(), 'public/update', relativePath);
  } else {
    // Dist folder
    filePath = path.join(process.cwd(), 'dist', pathname === '/' ? 'index.html' : pathname);
  }

  // Security: check path traversal
  const resolvedPath = path.resolve(filePath);
  const distDir = path.resolve(process.cwd(), 'dist');
  const uploadDir = path.resolve(process.cwd(), 'public/update');

  const isUnderDist = resolvedPath.startsWith(distDir);
  const isUnderUpload = resolvedPath.startsWith(uploadDir);

  if (!isUnderDist && !isUnderUpload) {
    sendJson(res, 403, { error: 'Acceso denegado.' });
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If file does not exist under dist, fall back to index.html (for SPA routing)
      const indexPath = path.join(distDir, 'index.html');
      fs.readFile(indexPath, (errIndex, contentIndex) => {
        if (errIndex) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(contentIndex);
        }
      });
    } else {
      // Serve the file with proper content type
      const ext = path.extname(resolvedPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Support Range Requests for video streaming (HTTP 206)
      const range = req.headers.range;
      const isVideo = ['.mp4', '.webm', '.ogg'].includes(ext);
      
      if (range && isVideo) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000'
        });
        
        const stream = fs.createReadStream(resolvedPath, { start, end });
        stream.on('error', () => {
          if (!res.headersSent) sendJson(res, 500, { error: 'Error streaming file.' });
        });
        stream.pipe(res);
      } else {
        const headers = { 
          'Content-Type': contentType,
          'Content-Length': stats.size
        };
        
        // Cache control headers for static assets
        if (resolvedPath.includes(path.join(process.cwd(), 'dist', 'assets')) || ext === '.woff2') {
          headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else if (pathname.startsWith('/update/')) {
          headers['Cache-Control'] = 'public, max-age=86400'; // 1 day cache for uploads
        }
        
        res.writeHead(200, headers);
        const stream = fs.createReadStream(resolvedPath);
        stream.on('error', () => {
          if (!res.headersSent) sendJson(res, 500, { error: 'Error streaming file.' });
        });
        stream.pipe(res);
      }
    }
  });
});

// Pre-initialize DB connection on server startup
ensureDb().catch(err => {
  console.warn(`[DB] Pre-inicialización de base de datos falló: ${err.message}`);
});

server.listen(PORT, () => {
  console.log(`[Server] Servidor de producción escuchando en http://localhost:${PORT}`);
});
