import { dispatchApiRoute } from '../../backend/router.js';

export default async (request, context) => {
  // Read body text first
  let bodyText = '';
  try {
    if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
      bodyText = await request.text();
    }
  } catch (e) {
    console.error('[Netlify API] Error reading request body:', e);
  }

  return new Promise((resolve) => {
    let responseStatus = 200;
    let responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      resolve(new Response(null, { status: 204, headers: responseHeaders }));
      return;
    }

    // Set up mock request and response compatible with our Node.js HTTP router
    const callbacks = {};
    const mockReq = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      on: (event, callback) => {
        callbacks[event] = callback;
        if (event === 'end') {
          // Trigger asynchronous events to mimic Node.js request stream
          setTimeout(() => {
            if (callbacks['data']) {
              callbacks['data'](bodyText);
            }
            if (callbacks['end']) {
              callbacks['end']();
            }
          }, 0);
        }
      }
    };

    const mockRes = {
      writeHead: (status, headers) => {
        responseStatus = status;
        responseHeaders = { ...responseHeaders, ...headers };
      },
      end: (body) => {
        resolve(new Response(body, {
          status: responseStatus,
          headers: responseHeaders
        }));
      }
    };

    dispatchApiRoute(mockReq, mockRes)
      .then((isHandled) => {
        if (!isHandled) {
          resolve(new Response(JSON.stringify({ error: 'Route Not Found' }), {
            status: 404,
            headers: responseHeaders
          }));
        }
      })
      .catch((err) => {
        console.error('[Netlify API] Error dispatching route:', err);
        resolve(new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: responseHeaders
        }));
      });
  });
};

export const config = {
  path: "/api/*"
};
