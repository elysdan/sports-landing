import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { defaultBillboardData } from './backend/seedData.js';

dotenv.config();

let pool = null;

// Initialize DB connection
async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || 'sportlanding';

  let connected = false;

  // 1. Try to connect without database to create it if it doesn't exist
  try {
    console.log(`[DB] Verificando/Creando base de datos '${database}' en MySQL...`);
    const adminConnection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await adminConnection.end();
    console.log(`[DB] Base de datos '${database}' verificada/creada con éxito.`);
    connected = true;
  } catch (err) {
    console.warn(`[DB] Error o advertencia al verificar base de datos MySQL: ${err.message}`);
  }

  // 2. Initialize connection pool with selected database
  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
    
    // Test pool connection
    const connection = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a la base de datos MySQL '${database}'.`);
    connection.release();
    connected = true;
  } catch (err) {
    console.error(`[DB] Error fatal al conectar al pool de MySQL: ${err.message}`);
    throw new Error('No se pudo establecer conexión con la base de datos MySQL.');
  }

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

  // Create media_assets table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_data LONGTEXT NOT NULL,
      size_bytes INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[DB] Tabla media_assets verificada/creada.');

  // Create billboard_history table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billboard_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      approved_by VARCHAR(50) DEFAULT 'Desconocido',
      modified_by VARCHAR(50) DEFAULT 'Desconocido',
      config_data LONGTEXT NOT NULL,
      version BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_billboard_history_created_at (created_at DESC)
    )
  `);
  console.log('[DB] Tabla billboard_history verificada/creada.');

  // Create world_cup_teams table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS world_cup_teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      code VARCHAR(10) NOT NULL,
      flag VARCHAR(255) NOT NULL
    )
  `);
  console.log('[DB] Tabla world_cup_teams verificada/creada.');

  // Seed default World Cup teams - only seed if table has fewer than 48 teams
  const [teamsCountRes] = await pool.query('SELECT COUNT(*) as count FROM world_cup_teams');
  const teamsCount = parseInt(teamsCountRes[0].count) || 0;
  if (teamsCount < 48) {
    console.log(`[DB] Sembrando selecciones oficiales del mundial (Equipos actuales: ${teamsCount}/48)...`);
    await pool.query('DELETE FROM world_cup_teams');
    const defaultTeams = [
      { name: 'Canadá', code: 'CAN', flag: '🇨🇦' },
      { name: 'México', code: 'MEX', flag: '🇲🇽' },
      { name: 'Estados Unidos', code: 'USA', flag: '🇺🇸' },
      { name: 'Australia', code: 'AUS', flag: '🇦🇺' },
      { name: 'Irak', code: 'IRQ', flag: '🇮🇶' },
      { name: 'Irán', code: 'IRN', flag: '🇮🇷' },
      { name: 'Japón', code: 'JPN', flag: '🇯🇵' },
      { name: 'Jordania', code: 'JOR', flag: '🇯🇴' },
      { name: 'Corea del Sur', code: 'KOR', flag: '🇰🇷' },
      { name: 'Catar', code: 'QAT', flag: '🇶🇦' },
      { name: 'Arabia Saudita', code: 'KSA', flag: '🇸🇦' },
      { name: 'Uzbekistán', code: 'UZB', flag: '🇺🇿' },
      { name: 'Argelia', code: 'ALG', flag: '🇩🇿' },
      { name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻' },
      { name: 'Rep. Dem. del Congo', code: 'COD', flag: '🇨🇩' },
      { name: 'Costa de Marfil', code: 'CIV', flag: '🇨🇮' },
      { name: 'Egipto', code: 'EGY', flag: '🇪🇬' },
      { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
      { name: 'Marruecos', code: 'MAR', flag: '🇲🇦' },
      { name: 'Senegal', code: 'SEN', flag: '🇸🇳' },
      { name: 'Sudáfrica', code: 'RSA', flag: '🇿🇦' },
      { name: 'Túnez', code: 'TUN', flag: '🇹🇳' },
      { name: 'Curazao', code: 'CUW', flag: '🇨🇼' },
      { name: 'Haití', code: 'HAI', flag: '🇭🇹' },
      { name: 'Panamá', code: 'PAN', flag: '🇵🇦' },
      { name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
      { name: 'Brasil', code: 'BRA', flag: '🇧🇷' },
      { name: 'Colombia', code: 'COL', flag: '🇨🇴' },
      { name: 'Ecuador', code: 'ECU', flag: '🇪🇨' },
      { name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
      { name: 'Uruguay', code: 'URU', flag: '🇺🇾' },
      { name: 'Nueva Zelanda', code: 'NZL', flag: '🇳🇿' },
      { name: 'Austria', code: 'AUT', flag: '🇦🇹' },
      { name: 'Bélgica', code: 'BEL', flag: '🇧🇪' },
      { name: 'Bosnia y Herzegovina', code: 'BIH', flag: '🇧🇦' },
      { name: 'Croacia', code: 'CRO', flag: '🇭🇷' },
      { name: 'República Checa', code: 'CZE', flag: '🇨🇿' },
      { name: 'Inglaterra', code: 'ENG', flag: 'ENG' },
      { name: 'Francia', code: 'FRA', flag: '🇫🇷' },
      { name: 'Alemania', code: 'GER', flag: '🇩🇪' },
      { name: 'Países Bajos', code: 'NED', flag: '🇳🇱' },
      { name: 'Noruega', code: 'NOR', flag: '🇳🇴' },
      { name: 'Portugal', code: 'POR', flag: '🇵🇹' },
      { name: 'Escocia', code: 'SCO', flag: 'SCO' },
      { name: 'España', code: 'ESP', flag: '🇪🇸' },
      { name: 'Suecia', code: 'SWE', flag: '🇸🇪' },
      { name: 'Suiza', code: 'SUI', flag: '🇨🇭' },
      { name: 'Turquía', code: 'TUR', flag: '🇹🇷' }
    ];

    for (const team of defaultTeams) {
      await pool.query(`
        INSERT INTO world_cup_teams (name, code, flag)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE code = VALUES(code), flag = VALUES(flag)
      `, [team.name, team.code, team.flag]);
    }
    console.log('[DB] Se han sembrado exactamente las 48 selecciones oficiales del mundial 2026 de la FIFA.');
  }

  // Seed default users if they do not exist
  const defaultUsers = [
    { username: 'admin', password: 'admin1234', name: 'Administrador', allowedTypes: ['*'] },
    { username: 'aprobador', password: 'aprobador1234', name: 'Usuario Aprobador', allowedTypes: ['*', 'approve'] },
    { username: 'editor', password: 'editor1234', name: 'Usuario Editor', allowedTypes: ['*'] },
    { username: 'multimedia', password: 'multimedia1234', name: 'Usuario Galería', allowedTypes: ['readonly_media_add'] }
  ];

  const [existingUsersRes] = await pool.query('SELECT username FROM users');
  const existingUsernames = existingUsersRes.map(r => r.username.toLowerCase());

  for (const u of defaultUsers) {
    if (!existingUsernames.includes(u.username.toLowerCase())) {
      await pool.query(`
        INSERT INTO users (username, password, name, allowed_types)
        VALUES (?, ?, ?, ?)
      `, [u.username, u.password, u.name, JSON.stringify(u.allowedTypes)]);
      console.log(`[DB] Usuario por defecto (${u.username} / ${u.password}) creado.`);
    }
  }

  // Seed default billboard config if empty
  const [configRows] = await pool.query("SELECT COUNT(*) as count FROM billboard_config WHERE key_name = 'live'");
  if (parseInt(configRows[0].count) === 0) {
    const defaultDataStr = JSON.stringify(defaultBillboardData);
    await pool.query(`
      INSERT INTO billboard_config (key_name, config_data, version)
      VALUES (?, ?, ?)
    `, ['live', defaultDataStr, Date.now()]);
    console.log('[DB] Configuración por defecto de la valla creada en la base de datos.');
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

// --- Layout configuration functions ---

export async function getConfig(keyName) {
  await ensureDb();
  const [rows] = await pool.query('SELECT config_data, version FROM billboard_config WHERE key_name = ?', [keyName]);
  if (rows.length > 0) {
    return {
      ...JSON.parse(rows[0].config_data),
      version: parseInt(rows[0].version)
    };
  }
  return null;
}

export async function saveConfig(keyName, data, version, approvedBy = 'Desconocido', modifiedBy = 'Desconocido') {
  await ensureDb();
  data.publishedBy = approvedBy;
  data.modifiedBy = modifiedBy;
  data.approvedBy = approvedBy;

  const jsonStr = JSON.stringify(data);
  await pool.query(`
    INSERT INTO billboard_config (key_name, config_data, version)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE config_data = VALUES(config_data), version = VALUES(version)
  `, [keyName, jsonStr, version]);
  console.log(`[DB] Configuración '${keyName}' guardada en MySQL. Versión: ${version}`);

  if (keyName === 'live') {
    await pool.query(`
      INSERT INTO billboard_history (username, approved_by, modified_by, config_data, version)
      VALUES (?, ?, ?, ?, ?)
    `, [approvedBy, approvedBy, modifiedBy, jsonStr, version]);
    console.log(`[DB] Historial registrado en base de datos. Aprobado por: ${approvedBy}`);

    // MySQL limit deletion requires a wrapper subquery
    await pool.query(`
      DELETE FROM billboard_history
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM billboard_history
          ORDER BY id DESC
          LIMIT 10
        ) as temp
      )
    `);
  }
  return true;
}

export async function getVersion(keyName) {
  await ensureDb();
  const [rows] = await pool.query('SELECT version FROM billboard_config WHERE key_name = ?', [keyName]);
  if (rows.length > 0) {
    return parseInt(rows[0].version);
  }
  return null;
}

// --- User management functions ---

export async function authenticateDbUser(username, password) {
  await ensureDb();
  const [rows] = await pool.query('SELECT username, name, password, allowed_types FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  if (rows.length > 0 && rows[0].password === password) {
    return {
      username: rows[0].username,
      name: rows[0].name,
      allowedTypes: JSON.parse(rows[0].allowed_types)
    };
  }
  return null;
}

export async function getDbUsers() {
  await ensureDb();
  const [rows] = await pool.query('SELECT username, name, allowed_types FROM users');
  return rows.map(r => ({
    username: r.username,
    name: r.name,
    allowedTypes: JSON.parse(r.allowed_types)
  }));
}

export async function createDbUser(username, password, name, allowedTypes) {
  await ensureDb();
  const allowedTypesStr = JSON.stringify(allowedTypes);
  if (!password) {
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
}

export async function deleteDbUser(username) {
  await ensureDb();
  if (username.toLowerCase() === 'admin') {
    console.warn('[DB] No se puede eliminar el usuario administrador predeterminado.');
    return false;
  }
  await pool.query('DELETE FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  console.log(`[DB] Usuario '${username}' eliminado de MySQL.`);
  return true;
}

// --- Billboard template functions ---

export async function getDbTemplates() {
  await ensureDb();
  const [rows] = await pool.query('SELECT id, template_name, config_data, created_at FROM billboard_templates ORDER BY created_at DESC');
  return rows.map(r => ({
    id: r.id,
    template_name: r.template_name,
    config_data: JSON.parse(r.config_data),
    created_at: r.created_at
  }));
}

export async function createDbTemplate(name, configData) {
  await ensureDb();
  const configDataStr = JSON.stringify(configData);
  await pool.query(`
    INSERT INTO billboard_templates (template_name, config_data)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE config_data = VALUES(config_data)
  `, [name, configDataStr]);
  console.log(`[DB] Plantilla '${name}' guardada en MySQL.`);
  return true;
}

export async function deleteDbTemplate(id) {
  await ensureDb();
  if (isNaN(id)) {
    await pool.query('DELETE FROM billboard_templates WHERE template_name = ?', [id]);
  } else {
    await pool.query('DELETE FROM billboard_templates WHERE id = ?', [parseInt(id)]);
  }
  console.log(`[DB] Plantilla '${id}' eliminada de MySQL.`);
  return true;
}

// --- Media Assets Storage Functions ---

export async function saveMediaAsset(filename, mimeType, base64Data, sizeBytes) {
  await ensureDb();
  await pool.query(`
    INSERT INTO media_assets (filename, mime_type, file_data, size_bytes)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type), file_data = VALUES(file_data), size_bytes = VALUES(size_bytes)
  `, [filename, mimeType, base64Data, sizeBytes]);
  console.log(`[DB] Archivo multimedia '${filename}' guardado en MySQL.`);
  return true;
}

export async function getMediaAsset(filename) {
  await ensureDb();
  const [rows] = await pool.query('SELECT mime_type, file_data FROM media_assets WHERE filename = ?', [filename]);
  if (rows.length > 0) {
    return {
      mimeType: rows[0].mime_type,
      fileData: rows[0].file_data
    };
  }
  return null;
}

export async function listMediaAssets() {
  await ensureDb();
  const [rows] = await pool.query('SELECT filename, mime_type, size_bytes, created_at FROM media_assets ORDER BY created_at DESC');
  return rows.map(r => ({
    filename: r.filename,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at
  }));
}

export async function deleteMediaAsset(filename) {
  await ensureDb();
  await pool.query('DELETE FROM media_assets WHERE filename = ?', [filename]);
  console.log(`[DB] Archivo '${filename}' eliminado de MySQL.`);
  return true;
}

export async function isUserApprover(username) {
  if (!username) return false;
  await ensureDb();
  if (username.toLowerCase() === 'admin') return true;
  const [rows] = await pool.query('SELECT allowed_types FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  if (rows.length > 0) {
    const allowedTypes = JSON.parse(rows[0].allowed_types);
    return allowedTypes.includes('approve') || allowedTypes.includes('*');
  }
  return false;
}

export async function canUserDeleteMedia(username) {
  if (!username) return false;
  await ensureDb();
  if (username.toLowerCase() === 'admin') return true;
  const [rows] = await pool.query('SELECT allowed_types FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  if (rows.length > 0) {
    const allowedTypes = JSON.parse(rows[0].allowed_types);
    return allowedTypes.includes('approve') || allowedTypes.includes('delete_media');
  }
  return false;
}

export async function getDbHistory() {
  await ensureDb();
  const [rows] = await pool.query('SELECT username, approved_by, modified_by, config_data, version, created_at FROM billboard_history ORDER BY created_at DESC');
  return rows.map(r => {
    const parsedConfig = JSON.parse(r.config_data);
    return {
      username: r.username || r.approved_by || parsedConfig.approvedBy || 'Desconocido',
      approved_by: r.approved_by || r.username || parsedConfig.approvedBy || 'Desconocido',
      modified_by: r.modified_by || parsedConfig.modifiedBy || 'Desconocido',
      config_data: parsedConfig,
      version: parseInt(r.version),
      createdAt: r.created_at,
      created_at: r.created_at
    };
  });
}

export async function getDbWorldCupTeams() {
  await ensureDb();
  const [rows] = await pool.query('SELECT name, code, flag FROM world_cup_teams ORDER BY name ASC');
  return rows;
}
