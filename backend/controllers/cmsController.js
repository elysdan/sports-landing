import { getConfig, saveConfig, getVersion, getDbHistory, isUserApprover, getDbWorldCupTeams } from '../../db.js';
import { readJsonBody, sendJson } from '../utils.js';

export async function handleGetCms(req, res) {
  try {
    const config = await getConfig('live');
    sendJson(res, 200, config || {});
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetCmsVersion(req, res) {
  try {
    const version = await getVersion('live');
    sendJson(res, 200, { version: version || 0 });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handlePostCms(req, res) {
  try {
    const { config, approvedBy, modifiedBy } = await readJsonBody(req);
    const version = Date.now();
    await saveConfig('live', config, version, approvedBy, modifiedBy);
    sendJson(res, 200, { success: true, version });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetCmsHistory(req, res, parsedUrl) {
  try {
    const username = parsedUrl.searchParams.get('username');
    const isApprover = await isUserApprover(username);
    if (!isApprover) {
      sendJson(res, 403, { error: 'Acceso denegado: Solo los usuarios aprobadores pueden ver el histórico.' });
      return;
    }
    const historyList = await getDbHistory();
    sendJson(res, 200, historyList);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetCmsDraft(req, res) {
  try {
    let config = await getConfig('draft');
    if (!config || !config.modules) {
      // Fallback to live config if draft is empty
      config = await getConfig('live');
    }
    sendJson(res, 200, config || {});
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handlePostCmsDraft(req, res) {
  try {
    const { config, modifiedBy } = await readJsonBody(req);
    const version = Date.now();
    await saveConfig('draft', config, version, 'Sistema', modifiedBy || 'Desconocido');
    sendJson(res, 200, { success: true, version });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetWorldCupTeams(req, res) {
  try {
    const teams = await getDbWorldCupTeams();
    sendJson(res, 200, teams);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}
