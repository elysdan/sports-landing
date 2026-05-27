import { getDbTemplates, createDbTemplate, deleteDbTemplate } from '../../db.js';
import { readJsonBody, sendJson } from '../utils.js';

export async function handleGetTemplates(req, res) {
  try {
    const templatesList = await getDbTemplates();
    sendJson(res, 200, templatesList);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handlePostTemplates(req, res) {
  try {
    const { name, config } = await readJsonBody(req);
    if (!name || !config) {
      sendJson(res, 400, { error: 'Falta el nombre o la configuración de la plantilla' });
      return;
    }
    const success = await createDbTemplate(name, config);
    if (success) {
      sendJson(res, 200, { success: true });
    } else {
      sendJson(res, 500, { error: 'No se pudo guardar la plantilla' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleDeleteTemplate(req, res, parsedUrl) {
  try {
    const id = parsedUrl.searchParams.get('id');
    if (!id) {
      sendJson(res, 400, { error: 'Falta el ID de la plantilla' });
      return;
    }
    const success = await deleteDbTemplate(id);
    if (success) {
      sendJson(res, 200, { success: true });
    } else {
      sendJson(res, 500, { error: 'No se pudo eliminar la plantilla' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}
