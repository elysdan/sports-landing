import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'file-upload-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
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
          } else {
            next();
          }
        });
      }
    }
  ],
})
