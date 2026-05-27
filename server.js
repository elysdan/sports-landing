import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, saveConfig, getVersion, authenticateDbUser, getDbUsers, createDbUser, deleteDbUser, getDbTemplates, createDbTemplate, deleteDbTemplate, getDbHistory, isUserApprover } from './db.js';

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

// Helper to read JSON request body
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper to send JSON responses
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API: CMS Endpoints
  if (req.method === 'GET' && pathname === '/api/cms') {
    try {
      const config = await getConfig('live');
      sendJson(res, 200, config || {});
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/cms/version') {
    try {
      const version = await getVersion('live');
      sendJson(res, 200, { version: version || 0 });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/cms') {
    try {
      const { config, approvedBy, modifiedBy } = await readJsonBody(req);
      const version = Date.now();
      await saveConfig('live', config, version, approvedBy, modifiedBy);
      sendJson(res, 200, { success: true, version });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/cms/history') {
    try {
      const username = parsedUrl.searchParams.get('username');
      const isApprover = await isUserApprover(username);
      if (!isApprover) {
        sendJson(res, 403, { error: 'Acceso denegado: Solo los usuarios aprobadores pueden ver el histórico.' });
        return;
      }
      const historyList = await getDbHistory();
      sendJson(res, 200, historyList);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 1.5. API: Auth & User management endpoints
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    try {
      const { username, password } = await readJsonBody(req);
      if (!username || !password) {
        sendJson(res, 400, { error: 'Falta usuario o contraseña' });
        return;
      }
      const user = await authenticateDbUser(username, password);
      if (user) {
        sendJson(res, 200, user);
      } else {
        sendJson(res, 401, { error: 'Usuario o contraseña incorrectos' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    try {
      const usersList = await getDbUsers();
      sendJson(res, 200, usersList);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/users') {
    try {
      const { username, password, name, allowedTypes } = await readJsonBody(req);
      if (!username || !name || !allowedTypes) {
        sendJson(res, 400, { error: 'Faltan campos requeridos' });
        return;
      }
      const success = await createDbUser(username, password, name, allowedTypes);
      if (success) {
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 500, { error: 'No se pudo guardar el usuario' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE' && pathname === '/api/users') {
    try {
      const username = parsedUrl.searchParams.get('username');
      if (!username) {
        sendJson(res, 400, { error: 'Falta el nombre de usuario' });
        return;
      }
      if (username.toLowerCase() === 'admin') {
        sendJson(res, 400, { error: 'No se puede eliminar el usuario administrador predeterminado' });
        return;
      }
      const success = await deleteDbUser(username);
      if (success) {
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 500, { error: 'No se pudo eliminar el usuario' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 1.8. API: Billboard template endpoints
  if (req.method === 'GET' && pathname === '/api/templates') {
    try {
      const templatesList = await getDbTemplates();
      sendJson(res, 200, templatesList);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/templates') {
    try {
      const { name, config } = await readJsonBody(req);
      if (!name || !config) {
        sendJson(res, 400, { error: 'Falta el nombre o la configuración de la plantilla' });
        return;
      }
      const success = await createDbTemplate(name, config);
      if (success) {
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 500, { error: 'No se pudo guardar la plantilla' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE' && pathname === '/api/templates') {
    try {
      const id = parsedUrl.searchParams.get('id');
      if (!id) {
        sendJson(res, 400, { error: 'Falta el ID de la plantilla' });
        return;
      }
      const success = await deleteDbTemplate(id);
      if (success) {
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 500, { error: 'No se pudo eliminar la plantilla' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 2. API: Media Upload / List / Delete Endpoints
  if (req.method === 'POST' && pathname === '/api/upload') {
    try {
      const data = await readJsonBody(req);
      const { filename, base64 } = data;

      if (!filename || !base64) {
        sendJson(res, 400, { error: 'Missing filename or base64 data' });
        return;
      }

      const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const uploadDir = path.resolve(process.cwd(), 'public/update');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const safeName = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const filePath = path.join(uploadDir, safeName);

      fs.writeFileSync(filePath, buffer);

      sendJson(res, 200, { url: `/update/${safeName}` });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/media') {
    try {
      const mediaFiles = [];
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4', '.webm', '.ogg'];

      const scanDir = (dirPath, publicPrefix) => {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
              const ext = path.extname(file).toLowerCase();
              if (allowedExts.includes(ext)) {
                const isVideo = ['.mp4', '.webm', '.ogg'].includes(ext);
                mediaFiles.push({
                  url: `${publicPrefix}${file}`,
                  filename: file,
                  type: isVideo ? 'video' : 'image',
                  size: stat.size,
                  mtime: stat.mtimeMs
                });
              }
            }
          });
        }
      };

      // Scan public/update/
      scanDir(path.resolve(process.cwd(), 'public/update'), '/update/');
      // Scan dist/ root (which contains build-time public files)
      scanDir(path.resolve(process.cwd(), 'dist'), '/');

      mediaFiles.sort((a, b) => b.mtime - a.mtime);
      sendJson(res, 200, mediaFiles);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE' && pathname === '/api/media') {
    try {
      const mediaUrl = parsedUrl.searchParams.get('url');

      if (!mediaUrl) {
        sendJson(res, 400, { error: 'Falta el parametro url en la consulta' });
        return;
      }

      if (!mediaUrl.startsWith('/update/')) {
        sendJson(res, 403, { error: 'Solo se pueden eliminar archivos subidos dinamicamente (/update/).' });
        return;
      }

      const relativePath = mediaUrl.replace(/^\/update\//, '');
      const uploadDir = path.resolve(process.cwd(), 'public/update');
      const filePath = path.join(uploadDir, relativePath);

      const relativeResolved = path.relative(uploadDir, filePath);
      if (relativeResolved.startsWith('..') || path.isAbsolute(relativeResolved)) {
        sendJson(res, 403, { error: 'Acceso denegado.' });
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 404, { error: 'Archivo no encontrado en el servidor' });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 3. Static File Server & Client-side routing fallback
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
      
      fs.readFile(resolvedPath, (errRead, contentRead) => {
        if (errRead) {
          sendJson(res, 500, { error: 'Error reading file.' });
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(contentRead);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Servidor de producción escuchando en http://localhost:${PORT}`);
});
