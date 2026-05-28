import fs from 'fs';
import path from 'path';
import { readJsonBody, sendJson } from '../utils.js';
import { saveMediaAsset, getMediaAsset, listMediaAssets, deleteMediaAsset } from '../../db.js';

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
    const timestamp = Date.now();
    const safeName = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

    const mimeType = base64.match(/^data:([^;]+);base64,/)?.[1] || 'application/octet-stream';
    await saveMediaAsset(safeName, mimeType, base64Data, buffer.length);
    sendJson(res, 200, { url: `/api/media/file?name=${safeName}` });
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

    // Scan local directories
    scanDir(path.resolve(process.cwd(), 'public/update'), '/update/');
    scanDir(path.resolve(process.cwd(), 'public'), '/');
    scanDir(path.resolve(process.cwd(), 'dist'), '/');

    // Merge database assets
    const dbAssets = await listMediaAssets();
    dbAssets.forEach(asset => {
      const url = `/api/media/file?name=${asset.filename}`;
      const ext = path.extname(asset.filename).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.ogg'].includes(ext);
      
      mediaMap.set(url, {
        url,
        filename: asset.filename,
        type: isVideo ? 'video' : 'image',
        size: asset.sizeBytes,
        mtime: new Date(asset.createdAt).getTime()
      });
    });

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
    const username = parsedUrl.searchParams.get('username');

    if (!username || username.toLowerCase() !== 'admin') {
      sendJson(res, 403, { error: 'Acceso denegado: Solo el administrador puede eliminar archivos multimedia' });
      return;
    }

    if (!mediaUrl) {
      sendJson(res, 400, { error: 'Falta el parámetro url en la consulta' });
      return;
    }

    // Handle database assets
    if (mediaUrl.startsWith('/api/media/file')) {
      const filename = new URL(mediaUrl, 'http://localhost').searchParams.get('name');
      if (!filename) {
        sendJson(res, 400, { error: 'Falta el nombre del archivo' });
        return;
      }
      await deleteMediaAsset(filename);
      sendJson(res, 200, { success: true });
      return;
    }

    // Handle filesystem assets
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

export async function handleGetMediaFile(req, res, parsedUrl) {
  try {
    const filename = parsedUrl.searchParams.get('name');
    if (!filename) {
      sendJson(res, 400, { error: 'Falta el nombre del archivo' });
      return;
    }

    const asset = await getMediaAsset(filename);
    if (!asset) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no encontrado en la base de datos' }));
      return;
    }

    const buffer = Buffer.from(asset.fileData, 'base64');
    res.writeHead(200, {
      'Content-Type': asset.mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable'
    });
    res.end(buffer);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}
