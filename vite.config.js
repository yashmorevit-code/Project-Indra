import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Simple helper to load .env variables locally
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEq = trimmed.indexOf('=');
        if (firstEq > -1) {
          const key = trimmed.substring(0, firstEq).trim();
          const value = trimmed.substring(firstEq + 1).trim();
          process.env[key] = value;
        }
      }
    });
  }
}

// Vite plugin to execute /api/* serverless functions during local development
function localApiPlugin() {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const apiPath = url.pathname;
          
          const filePath = path.join(process.cwd(), apiPath + '.js');
          if (fs.existsSync(filePath)) {
            try {
              loadEnv();

              // Parse body for POST requests
              let body = {};
              if (req.method === 'POST') {
                body = await new Promise((resolve) => {
                  let data = '';
                  req.on('data', chunk => data += chunk);
                  req.on('end', () => {
                    try {
                      resolve(JSON.parse(data));
                    } catch {
                      resolve({});
                    }
                  });
                });
              }

              // Load and execute module in SSR context
              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;

              const mockRes = {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                }
              };

              const mockReq = {
                method: req.method,
                body,
                query: Object.fromEntries(url.searchParams.entries())
              };

              await handler(mockReq, mockRes);
              return;
            } catch (err) {
              console.error(`Error executing API ${apiPath}:`, err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
              return;
            }
          }
        }
        next();
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  base: '/',
})