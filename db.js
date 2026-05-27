import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let useFallback = false;
const fallbackFilePath = path.resolve(process.cwd(), 'public/update/billboard-data.json');
const usersFallbackFilePath = path.resolve(process.cwd(), 'public/update/users-data.json');
const historyFallbackFilePath = path.resolve(process.cwd(), 'public/update/billboard-history.json');

// Initialize DB connection
async function initDb() {
  try {
    const dbName = process.env.DB_DATABASE || 'sports_billboard';
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306');
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';

    // 1. Connect without selecting database to check/create it
    const tempConnection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Create the pool with the database
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a MySQL/MariaDB (Base de datos: ${dbName}).`);
    conn.release();

    // Create billboard_config table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(50) UNIQUE,
        config_data LONGTEXT,
        version BIGINT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Tabla billboard_config verificada/creada.');

    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        allowed_types TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Tabla users verificada/creada.');

    // Create billboard_templates table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template_name VARCHAR(100) UNIQUE NOT NULL,
        config_data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Tabla billboard_templates verificada/creada.');

    // Create billboard_history table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        approved_by VARCHAR(50) DEFAULT 'Desconocido',
        modified_by VARCHAR(50) DEFAULT 'Desconocido',
        config_data LONGTEXT NOT NULL,
        version BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Tabla billboard_history verificada/creada.');

    // Intentar agregar columnas si la tabla ya existía sin ellas
    try {
      await pool.query('ALTER TABLE billboard_history ADD COLUMN approved_by VARCHAR(50) DEFAULT "Desconocido"');
    } catch (e) { /* Columna ya existe */ }
    try {
      await pool.query('ALTER TABLE billboard_history ADD COLUMN modified_by VARCHAR(50) DEFAULT "Desconocido"');
    } catch (e) { /* Columna ya existe */ }

    // Seed default admin user if empty
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await pool.query(`
        INSERT INTO users (username, password, name, allowed_types)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin1234', 'Administrador', JSON.stringify(['*'])]);
      console.log('[DB] Usuario administrador por defecto (admin / admin1234) creado.');
    }

    useFallback = false; // Reset fallback state in case it was true
  } catch (err) {
    console.warn(`[DB] No se pudo conectar a MySQL/MariaDB: ${err.message}`);
    console.warn(`[DB] Usando modo de respaldo: Archivos JSON locales`);
    useFallback = true;
  }
}

// Lazy database initialization helper
let initPromise = null;
export async function ensureDb() {
  if (!initPromise) {
    initPromise = initDb();
  }
  return initPromise;
}

// Fallback JSON loader/saver helpers for layout
function loadFallback() {
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const content = fs.readFileSync(fallbackFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('[DB] Error al cargar archivo JSON de respaldo:', e);
  }
  return null;
}

function saveFallback(data) {
  try {
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[DB] Error al guardar archivo JSON de respaldo:', e);
    return false;
  }
}

// Fallback JSON loader/saver helpers for users
function loadUsersFallback() {
  try {
    if (fs.existsSync(usersFallbackFilePath)) {
      const content = fs.readFileSync(usersFallbackFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('[DB] Error al cargar archivo JSON de usuarios de respaldo:', e);
  }
  const defaultUsersList = [
    {
      id: 'admin',
      username: 'admin',
      password: 'admin1234',
      name: 'Administrador',
      allowedTypes: ['*']
    }
  ];
  saveUsersFallback(defaultUsersList);
  return defaultUsersList;
}

function saveUsersFallback(usersList) {
  try {
    const dir = path.dirname(usersFallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(usersFallbackFilePath, JSON.stringify(usersList, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[DB] Error al guardar archivo JSON de usuarios de respaldo:', e);
    return false;
  }
}

function loadHistoryFallback() {
  try {
    if (fs.existsSync(historyFallbackFilePath)) {
      const content = fs.readFileSync(historyFallbackFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('[DB] Error al cargar archivo JSON de historial de respaldo:', e);
  }
  return [];
}

function saveHistoryFallback(entry) {
  try {
    const list = loadHistoryFallback();
    list.unshift(entry);
    const limitedList = list.slice(0, 10);
    const dir = path.dirname(historyFallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(historyFallbackFilePath, JSON.stringify(limitedList, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[DB] Error al guardar archivo JSON de historial de respaldo:', e);
    return false;
  }
}

// --- Layout configuration functions ---

export async function getConfig(keyName) {
  await ensureDb();
  if (useFallback) {
    const local = loadFallback();
    return local;
  }
  try {
    const [rows] = await pool.query('SELECT config_data, version FROM billboard_config WHERE key_name = ?', [keyName]);
    if (rows.length > 0) {
      return {
        ...JSON.parse(rows[0].config_data),
        version: rows[0].version
      };
    }
  } catch (err) {
    console.error('[DB] Error al leer de MySQL, reintentando con respaldo:', err.message);
    const local = loadFallback();
    if (local) return local;
  }
  return null;
}

export async function saveConfig(keyName, data, version, approvedBy = 'Desconocido', modifiedBy = 'Desconocido') {
  await ensureDb();
  // Inject metadata into the JSON data for frontend convenience
  data.publishedBy = approvedBy;
  data.modifiedBy = modifiedBy;
  data.approvedBy = approvedBy;

  // Always write fallback JSON as secondary backup
  saveFallback({ ...data, version });
  saveHistoryFallback({ 
    username: approvedBy, 
    approved_by: approvedBy, 
    modified_by: modifiedBy, 
    config_data: data, 
    version, 
    created_at: new Date().toISOString() 
  });
  
  if (useFallback) {
    return true;
  }
  try {
    const jsonStr = JSON.stringify(data);
    await pool.query(`
      INSERT INTO billboard_config (key_name, config_data, version)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE config_data = VALUES(config_data), version = VALUES(version)
    `, [keyName, jsonStr, version]);
    console.log(`[DB] Configuración '${keyName}' guardada en MySQL. Versión: ${version}`);

    // Save in history table with all metadata
    await pool.query(`
      INSERT INTO billboard_history (username, approved_by, modified_by, config_data, version)
      VALUES (?, ?, ?, ?, ?)
    `, [approvedBy, approvedBy, modifiedBy, jsonStr, version]);
    console.log(`[DB] Historial registrado. Aprobado por: ${approvedBy}, Modificado por: ${modifiedBy}`);

    // Limitar el historial en MySQL a los últimos 10 cambios
    await pool.query(`
      DELETE FROM billboard_history
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM billboard_history
          ORDER BY id DESC
          LIMIT 10
        ) AS temp
      )
    `);
    console.log('[DB] Historial en MySQL limitado a los últimos 10 cambios.');

    return true;
  } catch (err) {
    console.error('[DB] Error al guardar en MySQL, guardado únicamente en JSON local:', err.message);
    return false;
  }
}

export async function getVersion(keyName) {
  await ensureDb();
  if (useFallback) {
    const local = loadFallback();
    return local ? local.version : null;
  }
  try {
    const [rows] = await pool.query('SELECT version FROM billboard_config WHERE key_name = ?', [keyName]);
    if (rows.length > 0) {
      return rows[0].version;
    }
  } catch (err) {
    console.error('[DB] Error al leer versión de MySQL:', err.message);
    const local = loadFallback();
    if (local) return local.version;
  }
  return null;
}

// --- User management functions ---

export async function authenticateDbUser(username, password) {
  await ensureDb();
  if (useFallback) {
    const list = loadUsersFallback();
    const found = list.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (found) {
      return { username: found.username, name: found.name, allowedTypes: found.allowedTypes };
    }
    return null;
  }
  try {
    const [rows] = await pool.query('SELECT username, name, password, allowed_types FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (rows.length > 0 && rows[0].password === password) {
      return {
        username: rows[0].username,
        name: rows[0].name,
        allowedTypes: JSON.parse(rows[0].allowed_types)
      };
    }
  } catch (err) {
    console.error('[DB] Error al autenticar en MySQL, reintentando con respaldo:', err.message);
    const list = loadUsersFallback();
    const found = list.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (found) {
      return { username: found.username, name: found.name, allowedTypes: found.allowedTypes };
    }
  }
  return null;
}

export async function getDbUsers() {
  await ensureDb();
  if (useFallback) {
    const list = loadUsersFallback();
    return list.map(u => ({ username: u.username, name: u.name, allowedTypes: u.allowedTypes }));
  }
  try {
    const [rows] = await pool.query('SELECT username, name, allowed_types FROM users');
    return rows.map(r => ({
      username: r.username,
      name: r.name,
      allowedTypes: JSON.parse(r.allowed_types)
    }));
  } catch (err) {
    console.error('[DB] Error al listar usuarios de MySQL, reintentando con respaldo:', err.message);
    const list = loadUsersFallback();
    return list.map(u => ({ username: u.username, name: u.name, allowedTypes: u.allowedTypes }));
  }
}

export async function createDbUser(username, password, name, allowedTypes) {
  await ensureDb();
  
  // Write to fallback JSON first
  const list = loadUsersFallback();
  const idx = list.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!password && idx === -1) {
    console.error('[DB] No se puede crear un usuario nuevo sin contraseña.');
    return false;
  }

  const finalPassword = password || (idx > -1 ? list[idx].password : '');
  
  const newUser = {
    id: idx > -1 ? list[idx].id : `user_${Date.now()}`,
    username,
    password: finalPassword,
    name,
    allowedTypes
  };
  if (idx > -1) {
    list[idx] = newUser;
  } else {
    list.push(newUser);
  }
  saveUsersFallback(list);

  if (useFallback) {
    return true;
  }
  try {
    const allowedTypesStr = JSON.stringify(allowedTypes);
    if (!password) {
      // Si la contraseña está vacía, no la sobreescribimos en MySQL
      await pool.query(`
        UPDATE users 
        SET name = ?, allowed_types = ? 
        WHERE LOWER(username) = LOWER(?)
      `, [name, allowedTypesStr, username]);
    } else {
      await pool.query(`
        INSERT INTO users (username, password, name, allowed_types)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), allowed_types = VALUES(allowed_types)
      `, [username, password, name, allowedTypesStr]);
    }
    console.log(`[DB] Usuario '${username}' guardado/actualizado en MySQL.`);
    return true;
  } catch (err) {
    console.error('[DB] Error al guardar usuario en MySQL:', err.message);
    return false;
  }
}

export async function deleteDbUser(username) {
  await ensureDb();
  if (username.toLowerCase() === 'admin') {
    console.warn('[DB] No se puede eliminar el usuario administrador predeterminado.');
    return false;
  }

  // Delete from fallback JSON
  const list = loadUsersFallback();
  const filtered = list.filter(u => u.username.toLowerCase() !== username.toLowerCase());
  saveUsersFallback(filtered);

  if (useFallback) {
    return true;
  }
  try {
    await pool.query('DELETE FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    console.log(`[DB] Usuario '${username}' eliminado de MySQL.`);
    return true;
  } catch (err) {
    console.error('[DB] Error al eliminar usuario de MySQL:', err.message);
    return false;
  }
}

// --- Billboard template functions ---

export async function getDbTemplates() {
  await ensureDb();
  if (useFallback) {
    return [];
  }
  try {
    const [rows] = await pool.query('SELECT id, template_name, config_data, created_at FROM billboard_templates ORDER BY created_at DESC');
    return rows.map(r => ({
      id: r.id,
      template_name: r.template_name,
      config_data: JSON.parse(r.config_data),
      created_at: r.created_at
    }));
  } catch (err) {
    console.error('[DB] Error al listar plantillas de MySQL:', err.message);
    return [];
  }
}

export async function createDbTemplate(name, configData) {
  await ensureDb();
  if (useFallback) {
    return false;
  }
  try {
    const configDataStr = JSON.stringify(configData);
    await pool.query(`
      INSERT INTO billboard_templates (template_name, config_data)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE config_data = VALUES(config_data)
    `, [name, configDataStr]);
    console.log(`[DB] Plantilla '${name}' guardada en MySQL.`);
    return true;
  } catch (err) {
    console.error('[DB] Error al guardar plantilla en MySQL:', err.message);
    return false;
  }
}

export async function deleteDbTemplate(id) {
  await ensureDb();
  if (useFallback) {
    return false;
  }
  try {
    if (isNaN(id)) {
      await pool.query('DELETE FROM billboard_templates WHERE template_name = ?', [id]);
    } else {
      await pool.query('DELETE FROM billboard_templates WHERE id = ?', [parseInt(id)]);
    }
    console.log(`[DB] Plantilla '${id}' eliminada de MySQL.`);
    return true;
  } catch (err) {
    console.error('[DB] Error al eliminar plantilla de MySQL:', err.message);
    return false;
  }
}

export async function isUserApprover(username) {
  if (!username) return false;
  await ensureDb();
  if (username.toLowerCase() === 'admin') return true;
  if (useFallback) {
    const list = loadUsersFallback();
    const found = list.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      return found.allowedTypes.includes('approve') || found.allowedTypes.includes('*');
    }
    return false;
  }
  try {
    const [rows] = await pool.query('SELECT allowed_types FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (rows.length > 0) {
      const allowedTypes = JSON.parse(rows[0].allowed_types);
      return allowedTypes.includes('approve') || allowedTypes.includes('*');
    }
  } catch (err) {
    console.error('[DB] Error al verificar si el usuario es aprobador en MySQL:', err.message);
  }
  return false;
}

export async function getDbHistory() {
  await ensureDb();
  if (useFallback) {
    const fallbackList = loadHistoryFallback();
    return fallbackList.map(item => ({
      username: item.username || item.approved_by || item.config_data?.approvedBy || 'Desconocido',
      approved_by: item.approved_by || item.username || item.config_data?.approvedBy || 'Desconocido',
      modified_by: item.modified_by || item.config_data?.modifiedBy || 'Desconocido',
      config_data: item.config_data,
      version: item.version,
      created_at: item.created_at
    }));
  }
  try {
    const [rows] = await pool.query('SELECT username, approved_by, modified_by, config_data, version, created_at FROM billboard_history ORDER BY created_at DESC');
    return rows.map(r => {
      const parsedConfig = JSON.parse(r.config_data);
      return {
        username: r.username || r.approved_by || parsedConfig.approvedBy || 'Desconocido',
        approved_by: r.approved_by || r.username || parsedConfig.approvedBy || 'Desconocido',
        modified_by: r.modified_by || parsedConfig.modifiedBy || 'Desconocido',
        config_data: parsedConfig,
        version: r.version,
        created_at: r.created_at
      };
    });
  } catch (err) {
    console.error('[DB] Error al obtener el historial de MySQL, usando fallback:', err.message);
    const fallbackList = loadHistoryFallback();
    return fallbackList.map(item => ({
      username: item.username || item.approved_by || item.config_data?.approvedBy || 'Desconocido',
      approved_by: item.approved_by || item.username || item.config_data?.approvedBy || 'Desconocido',
      modified_by: item.modified_by || item.config_data?.modifiedBy || 'Desconocido',
      config_data: item.config_data,
      version: item.version,
      created_at: item.created_at
    }));
  }
}
