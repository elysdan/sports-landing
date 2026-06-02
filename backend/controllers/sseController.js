// Active SSE clients set
const clients = new Set();

export function handleSseConnection(req, res) {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Prevent Nginx buffering in Plesk
  });

  // Send initial handshake / keepalive
  res.write('retry: 10000\n\n');
  res.write('data: {"status":"connected"}\n\n');

  clients.add(res);

  // Keep-alive heartbeat interval every 20 seconds to keep connection open in Plesk/Nginx
  const heartbeat = setInterval(() => {
    try {
      res.write(':\n\n'); // SSE comment format serves as a keep-alive heartbeat
    } catch (e) {
      // Ignorar fallos al escribir
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

export function broadcastEvent(event, data) {
  const payload = JSON.stringify(data || {});
  const message = `event: ${event}\ndata: ${payload}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  }
}
