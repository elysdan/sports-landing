import { handleGetCms, handleGetCmsVersion, handlePostCms, handleGetCmsHistory, handleGetCmsDraft, handlePostCmsDraft } from './controllers/cmsController.js';
import { handleLogin, handleGetUsers, handlePostUsers, handleDeleteUser } from './controllers/authController.js';
import { handleGetTemplates, handlePostTemplates, handleDeleteTemplate } from './controllers/templateController.js';
import { handlePostUpload, handleGetMedia, handleDeleteMedia } from './controllers/mediaController.js';

export async function dispatchApiRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CMS Endpoints
  if (method === 'GET' && pathname === '/api/cms') {
    await handleGetCms(req, res);
    return true;
  }
  if (method === 'GET' && pathname === '/api/cms/draft') {
    await handleGetCmsDraft(req, res);
    return true;
  }
  if (method === 'POST' && pathname === '/api/cms/draft') {
    await handlePostCmsDraft(req, res);
    return true;
  }
  if (method === 'GET' && pathname === '/api/cms/version') {
    await handleGetCmsVersion(req, res);
    return true;
  }
  if (method === 'POST' && pathname === '/api/cms') {
    await handlePostCms(req, res);
    return true;
  }
  if (method === 'GET' && pathname === '/api/cms/history') {
    await handleGetCmsHistory(req, res, parsedUrl);
    return true;
  }

  // Auth & Users
  if (method === 'POST' && pathname === '/api/auth/login') {
    await handleLogin(req, res);
    return true;
  }
  if (method === 'GET' && pathname === '/api/users') {
    await handleGetUsers(req, res);
    return true;
  }
  if (method === 'POST' && pathname === '/api/users') {
    await handlePostUsers(req, res);
    return true;
  }
  if (method === 'DELETE' && pathname === '/api/users') {
    await handleDeleteUser(req, res, parsedUrl);
    return true;
  }

  // Templates
  if (method === 'GET' && pathname === '/api/templates') {
    await handleGetTemplates(req, res);
    return true;
  }
  if (method === 'POST' && pathname === '/api/templates') {
    await handlePostTemplates(req, res);
    return true;
  }
  if (method === 'DELETE' && pathname === '/api/templates') {
    await handleDeleteTemplate(req, res, parsedUrl);
    return true;
  }

  // Media Endpoints
  if (method === 'POST' && pathname === '/api/upload') {
    await handlePostUpload(req, res);
    return true;
  }
  if (method === 'GET' && pathname === '/api/media') {
    await handleGetMedia(req, res);
    return true;
  }
  if (method === 'DELETE' && pathname === '/api/media') {
    await handleDeleteMedia(req, res, parsedUrl);
    return true;
  }

  return false; // Route not matched
}
