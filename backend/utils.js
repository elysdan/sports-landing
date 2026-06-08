export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;
    const MAX_SIZE = 20 * 1024 * 1024;

    req.on('data', chunk => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_SIZE) {
        req.destroy();
        reject(new Error('Payload demasiado grande. El límite es de 20MB.'));
      } else {
        body += chunk;
      }
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

export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
