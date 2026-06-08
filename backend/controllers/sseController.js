const clients = new Set();

export function handleSseConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  res.write('retry: 10000\n\n');
  res.write('data: {"status":"connected"}\n\n');

  clients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(':\n\n');
    } catch (e) {
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
