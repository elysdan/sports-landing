import { authenticateDbUser, getDbUsers, createDbUser, deleteDbUser } from '../../db.js';
import { readJsonBody, sendJson } from '../utils.js';

export async function handleLogin(req, res) {
  try {
    const { username, password } = await readJsonBody(req);
    if (!username || !password) {
      sendJson(res, 400, { error: 'Falta usuario o contraseña' });
      return;
    }
    const user = await authenticateDbUser(username, password);
    if (user) {
      sendJson(res, 200, user);
    } else {
      sendJson(res, 401, { error: 'Usuario o contraseña incorrectos' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetUsers(req, res) {
  try {
    const usersList = await getDbUsers();
    sendJson(res, 200, usersList);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handlePostUsers(req, res) {
  try {
    const { username, password, name, allowedTypes } = await readJsonBody(req);
    if (!username || !name || !allowedTypes) {
      sendJson(res, 400, { error: 'Faltan campos requeridos' });
      return;
    }
    const success = await createDbUser(username, password, name, allowedTypes);
    if (success) {
      sendJson(res, 200, { success: true });
    } else {
      sendJson(res, 500, { error: 'No se pudo guardar el usuario' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleDeleteUser(req, res, parsedUrl) {
  try {
    const username = parsedUrl.searchParams.get('username');
    if (!username) {
      sendJson(res, 400, { error: 'Falta el nombre de usuario' });
      return;
    }
    if (username.toLowerCase() === 'admin') {
      sendJson(res, 400, { error: 'No se puede eliminar el usuario administrador predeterminado' });
      return;
    }
    const success = await deleteDbUser(username);
    if (success) {
      sendJson(res, 200, { success: true });
    } else {
      sendJson(res, 500, { error: 'No se pudo eliminar el usuario' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}
