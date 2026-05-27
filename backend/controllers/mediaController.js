import fs from 'fs';
import path from 'path';
import { readJsonBody, sendJson } from '../utils.js';

export async function handlePostUpload(req, res) {
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
}

export async function handleGetMedia(req, res) {
  try {
    const mediaMap = new Map();
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
              const url = `${publicPrefix}${file}`;
              if (!mediaMap.has(url)) {
                mediaMap.set(url, {
                  url,
                  filename: file,
                  type: isVideo ? 'video' : 'image',
                  size: stat.size,
                  mtime: stat.mtimeMs
                });
              }
            }
          }
        });
      }
    };

    // Scan dynamic uploads first, then development public folder and production dist folder
    scanDir(path.resolve(process.cwd(), 'public/update'), '/update/');
    scanDir(path.resolve(process.cwd(), 'public'), '/');
    scanDir(path.resolve(process.cwd(), 'dist'), '/');

    const mediaFiles = Array.from(mediaMap.values());
    mediaFiles.sort((a, b) => b.mtime - a.mtime);

    sendJson(res, 200, mediaFiles);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleDeleteMedia(req, res, parsedUrl) {
  try {
    const mediaUrl = parsedUrl.searchParams.get('url');

    if (!mediaUrl) {
      sendJson(res, 400, { error: 'Falta el parámetro url en la consulta' });
      return;
    }

    if (!mediaUrl.startsWith('/update/')) {
      sendJson(res, 403, { error: 'Solo se pueden eliminar archivos subidos dinámicamente (/update/).' });
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
}
