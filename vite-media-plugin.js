import fs from 'fs';
import path from 'path';
import { getConfig, saveConfig, getVersion, authenticateDbUser, getDbUsers, createDbUser, deleteDbUser, getDbTemplates, createDbTemplate, deleteDbTemplate } from './db.js';

export default function mediaPlugin() {
  return {
    name: 'file-upload-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/upload') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { filename, base64 } = data;

              if (!filename || !base64) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
                return;
              }

              // Clean base64 prefix if exists (e.g. data:image/png;base64,)
              const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');

              // Determine destination directory public/update
              const uploadDir = path.resolve(process.cwd(), 'public/update');
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              // Generate safe name with a timestamp prefix to avoid conflicts
              const timestamp = Date.now();
              const safeName = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
              const filePath = path.join(uploadDir, safeName);

              fs.writeFileSync(filePath, buffer);

              // Return relative URL to the public folder
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ url: `/update/${safeName}` }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'GET' && req.url.startsWith('/api/media')) {
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
            // Scan public/ root
            scanDir(path.resolve(process.cwd(), 'public'), '/');

            // Sort by modification time desc (newest first)
            mediaFiles.sort((a, b) => b.mtime - a.mtime);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(mediaFiles));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'DELETE' && req.url.startsWith('/api/media')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const mediaUrl = parsedUrl.searchParams.get('url');

            if (!mediaUrl) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Falta el parametro url en la consulta' }));
              return;
            }

            // Seguridad: solo permitir eliminar archivos dentro de public/update/
            if (!mediaUrl.startsWith('/update/')) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Solo se pueden eliminar archivos subidos dinamicamente (/update/).' }));
              return;
            }

            const relativePath = mediaUrl.replace(/^\/update\//, '');
            const uploadDir = path.resolve(process.cwd(), 'public/update');
            const filePath = path.join(uploadDir, relativePath);

            // Evitar Path Traversal de seguridad
            const relativeResolved = path.relative(uploadDir, filePath);
            if (relativeResolved.startsWith('..') || path.isAbsolute(relativeResolved)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Acceso denegado.' }));
              return;
            }

            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Archivo no encontrado en el servidor' }));
            }
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'GET' && req.url === '/api/cms') {
          try {
            const config = await getConfig('live');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(config || {}));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'GET' && req.url === '/api/cms/version') {
          try {
            const version = await getVersion('live');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ version: version || 0 }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'POST' && req.url === '/api/cms') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const version = Date.now();
              await saveConfig('live', data, version);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, version }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'POST' && req.url === '/api/auth/login') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { username, password } = JSON.parse(body);
              if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Falta usuario o contraseña' }));
                return;
              }
              const user = await authenticateDbUser(username, password);
              if (user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(user));
              } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Usuario o contraseña incorrectos' }));
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'GET' && req.url === '/api/users') {
          try {
            const usersList = await getDbUsers();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(usersList));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'POST' && req.url === '/api/users') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { username, password, name, allowedTypes } = JSON.parse(body);
              if (!username || !name || !allowedTypes) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Faltan campos requeridos' }));
                return;
              }
              const success = await createDbUser(username, password, name, allowedTypes);
              if (success) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No se pudo guardar el usuario' }));
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'DELETE' && req.url.startsWith('/api/users')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const username = parsedUrl.searchParams.get('username');
            if (!username) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Falta el nombre de usuario' }));
              return;
            }
            if (username.toLowerCase() === 'admin') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No se puede eliminar el usuario administrador predeterminado' }));
              return;
            }
            const success = await deleteDbUser(username);
            if (success) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No se pudo eliminar el usuario' }));
            }
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'GET' && req.url === '/api/templates') {
          try {
            const templatesList = await getDbTemplates();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(templatesList));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.method === 'POST' && req.url === '/api/templates') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { name, config } = JSON.parse(body);
              if (!name || !config) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Falta el nombre o la configuración de la plantilla' }));
                return;
              }
              const success = await createDbTemplate(name, config);
              if (success) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No se pudo guardar la plantilla' }));
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'DELETE' && req.url.startsWith('/api/templates')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const id = parsedUrl.searchParams.get('id');
            if (!id) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Falta el ID de la plantilla' }));
              return;
            }
            const success = await deleteDbTemplate(id);
            if (success) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No se pudo eliminar la plantilla' }));
            }
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}
