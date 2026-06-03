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
    console.log(`[DB] Verificando/Creando base de datos '${database}' en MySQL con soporte utf8mb4...`);
    const adminConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      charset: 'utf8mb4'
    });
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
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
      queueLimit: 0,
      charset: 'utf8mb4'
    });
    
    // Test pool connection
    const connection = await pool.getConnection();
    await connection.query('SET NAMES utf8mb4');
    console.log(`[DB] Conectado exitosamente a la base de datos MySQL '${database}' con charset utf8mb4.`);
    connection.release();
    connected = true;
  } catch (err) {
    console.error(`[DB] Error fatal al conectar al pool de MySQL: ${err.message}`);
    throw new Error('No se pudo establecer conexión con la base de datos MySQL.');
  }

  // Convert database and set default collation
  try {
    await pool.query(`ALTER DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } catch (err) {
    console.warn(`[DB] No se pudo alterar el conjunto de caracteres de la base de datos: ${err.message}`);
  }

  // Create tables in parallel with explicit utf8mb4 charset
  await Promise.all([
    pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(50) UNIQUE,
        config_data LONGTEXT,
        version BIGINT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        allowed_types TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template_name VARCHAR(100) UNIQUE NOT NULL,
        config_data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS billboard_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        approved_by VARCHAR(50) DEFAULT 'Desconocido',
        modified_by VARCHAR(50) DEFAULT 'Desconocido',
        config_data LONGTEXT NOT NULL,
        version BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_billboard_history_created_at (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS world_cup_teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        code VARCHAR(10) NOT NULL,
        flag VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  ]);

  // Convert existing tables to utf8mb4 in case they were created with standard utf8 or latin1 in production
  try {
    console.log("[DB] Convirtiendo tablas existentes a charset utf8mb4...");
    await pool.query("ALTER TABLE billboard_config CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    await pool.query("ALTER TABLE world_cup_teams CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    await pool.query("ALTER TABLE billboard_history CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log("[DB] Conversión de tablas a utf8mb4 completada.");
  } catch (convErr) {
    console.warn(`[DB] No se pudo convertir las tablas a utf8mb4: ${convErr.message}`);
  }

  // Safe migration to drop file_data from media_assets if it still exists
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM media_assets LIKE 'file_data'");
    if (columns.length > 0) {
      console.log("[DB] Migración: Eliminando columna 'file_data' ineficiente de media_assets...");
      await pool.query("ALTER TABLE media_assets DROP COLUMN file_data");
      console.log("[DB] Columna 'file_data' eliminada con éxito.");
    }
  } catch (migErr) {
    console.warn(`[DB] No se pudo migrar/eliminar columna file_data (puede que ya no exista): ${migErr.message}`);
  }

  console.log('[DB] Todas las tablas han sido verificadas/creadas en paralelo.');

  // Seed default World Cup teams - only seed if table does not have exactly 48 teams OR has corrupted emoji flags (e.g. "??" due to previous encoding issue)
  const [teamsCountRes] = await pool.query('SELECT COUNT(*) as count FROM world_cup_teams');
  const teamsCount = parseInt(teamsCountRes[0].count) || 0;
  
  // Test if any team has a '?' in their flag, indicating encoding corruption
  let hasCorruptedFlags = false;
  try {
    const [testRows] = await pool.query("SELECT id FROM world_cup_teams WHERE flag LIKE '%?%' LIMIT 1");
    if (testRows.length > 0) {
      hasCorruptedFlags = true;
      console.log("[DB] Se detectaron banderas corruptas (con '?') debido a problemas previos de codificación.");
    }
  } catch (testErr) {
    console.warn("[DB] Error al buscar banderas corruptas:", testErr.message);
  }

  if (teamsCount !== 48 || hasCorruptedFlags) {
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

    const valuesPlaceholders = defaultTeams.map(() => '(?, ?, ?)').join(', ');
    const queryParams = defaultTeams.flatMap(team => [team.name, team.code, team.flag]);
    await pool.query(`
      INSERT INTO world_cup_teams (name, code, flag)
      VALUES ${valuesPlaceholders}
      ON DUPLICATE KEY UPDATE code = VALUES(code), flag = VALUES(flag)
    `, queryParams);
    console.log('[DB] Se han sembrado exactamente las 48 selecciones oficiales del mundial 2026 de la FIFA en un único lote.');
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

  const usersToInsert = [];
  const insertUserParams = [];
  for (const u of defaultUsers) {
    if (!existingUsernames.includes(u.username.toLowerCase())) {
      usersToInsert.push('(?, ?, ?, ?)');
      insertUserParams.push(u.username, u.password, u.name, JSON.stringify(u.allowedTypes));
    }
  }

  if (usersToInsert.length > 0) {
    await pool.query(`
      INSERT INTO users (username, password, name, allowed_types)
      VALUES ${usersToInsert.join(', ')}
    `, insertUserParams);
    console.log(`[DB] Se crearon los usuarios por defecto faltantes en lote.`);
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

  // Clean existing configs and templates from deleted module types (news, results, ticker)
  try {
    const [existingConfigs] = await pool.query("SELECT key_name, config_data FROM billboard_config");
    for (const row of existingConfigs) {
      let parsed = JSON.parse(row.config_data);
      const originalCount = parsed.modules?.length || 0;
      parsed = cleanConfigData(parsed);
      const newCount = parsed.modules?.length || 0;
      if (originalCount !== newCount) {
        await pool.query(
          "UPDATE billboard_config SET config_data = ?, version = ? WHERE key_name = ?",
          [JSON.stringify(parsed), Date.now(), row.key_name]
        );
        console.log(`[DB] Configuración '${row.key_name}' depurada: se eliminaron ${originalCount - newCount} módulos de tipo descontinuado (news, results, ticker).`);
      }
    }

    const [existingTemplates] = await pool.query("SELECT id, template_name, config_data FROM billboard_templates");
    for (const row of existingTemplates) {
      let parsed = JSON.parse(row.config_data);
      const originalCount = parsed.modules?.length || 0;
      parsed = cleanConfigData(parsed);
      const newCount = parsed.modules?.length || 0;
      if (originalCount !== newCount) {
        await pool.query(
          "UPDATE billboard_templates SET config_data = ? WHERE id = ?",
          [JSON.stringify(parsed), row.id]
        );
        console.log(`[DB] Plantilla '${row.template_name}' depurada.`);
      }
    }
  } catch (cleanErr) {
    console.warn(`[DB] Advertencia al depurar configuraciones existentes: ${cleanErr.message}`);
  }
}

function cleanConfigData(config) {
  if (!config || !Array.isArray(config.modules)) return config;
  const typesToRemove = ['news', 'results', 'ticker'];
  const removedIds = new Set();
  
  config.modules = config.modules.filter(m => {
    if (typesToRemove.includes(m.type)) {
      removedIds.add(m.id);
      return false;
    }
    return true;
  });
  
  if (config.layouts) {
    Object.keys(config.layouts).forEach(layoutKey => {
      const layout = config.layouts[layoutKey];
      if (layout && layout.positions) {
        Object.keys(layout.positions).forEach(modId => {
          if (removedIds.has(modId)) {
            delete layout.positions[modId];
          }
        });
      }
    });
  }
  return config;
}

// Lazy database initialization helper
let initPromise = null;
export async function ensureDb() {
  if (!initPromise) {
    initPromise = initDb().catch(err => {
      initPromise = null; // Clear promise on error so we retry on next call
      throw err;
    });
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

export async function saveMediaAsset(filename, mimeType, sizeBytes) {
  await ensureDb();
  await pool.query(`
    INSERT INTO media_assets (filename, mime_type, size_bytes)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type), size_bytes = VALUES(size_bytes)
  `, [filename, mimeType, sizeBytes]);
  console.log(`[DB] Archivo multimedia '${filename}' guardado en MySQL.`);
  return true;
}

export async function getMediaAsset(filename) {
  await ensureDb();
  const [rows] = await pool.query('SELECT mime_type, size_bytes FROM media_assets WHERE filename = ?', [filename]);
  if (rows.length > 0) {
    return {
      mimeType: rows[0].mime_type,
      sizeBytes: rows[0].size_bytes
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
  const [rows] = await pool.query('SELECT id, name, code, flag FROM world_cup_teams ORDER BY name ASC');
  return rows;
}

