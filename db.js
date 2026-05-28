import pg from 'pg';
import dotenv from 'dotenv';
import { defaultBillboardData } from './backend/seedData.js';

dotenv.config();

let pool = null;

// Initialize DB connection
async function initDb() {
  const { Pool } = pg;
  const poolConfig = {
    ssl: {
      rejectUnauthorized: false
    },
    max: 2, // Optimize for serverless: limit connections per container
    idleTimeoutMillis: 2000, // Close idle connections quickly
    connectionTimeoutMillis: 15000 // 15s timeout to allow cold-started Neon DBs to wake up
  };

  let connected = false;

  // 1. Try environment configuration (Netlify / Production)
  if (process.env.PG_CONNECTION_STRING || process.env.PG_HOST) {
    try {
      console.log('[DB] Intentando conectar a la base de datos configurada en el entorno...');
      if (process.env.PG_CONNECTION_STRING) {
        try {
          const dbUrl = new URL(process.env.PG_CONNECTION_STRING);
          console.log(`[DB] Inicializando Pool con PG_CONNECTION_STRING. Host: ${dbUrl.hostname}, DB: ${dbUrl.pathname}`);
        } catch (e) {
          console.log(`[DB] Inicializando Pool con PG_CONNECTION_STRING (formato no-URL o SSL string)`);
        }
        pool = new Pool({
          connectionString: process.env.PG_CONNECTION_STRING,
          ...poolConfig
        });
      } else {
        console.log(`[DB] Inicializando Pool con variables individuales. Host: ${process.env.PG_HOST}, DB: ${process.env.PG_DATABASE}`);
        pool = new Pool({
          host: process.env.PG_HOST,
          port: parseInt(process.env.PG_PORT || '5432'),
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD || 'postgres',
          database: process.env.PG_DATABASE || 'sportlanding',
          ...poolConfig
        });
      }

      // Test connection
      const client = await pool.connect();
      console.log(`[DB] Conectado exitosamente a PostgreSQL (Configuración de entorno).`);
      client.release();
      connected = true;
    } catch (err) {
      console.warn(`[DB] Error al conectar a la base de datos del entorno: ${err.message}`);
      if (pool) {
        await pool.end();
        pool = null;
      }
    }
  }

  // 2. Try local PostgreSQL connection if environment configuration was not successful or was missing
  if (!connected) {
    console.log('[DB] Intentando conectar a PostgreSQL local (localhost:5432)...');
    
    const localConfig = {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'sportlanding',
      max: 2,
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 5000
    };

    try {
      console.log(`[DB] Probando conexión local - Usuario: ${localConfig.user}, DB: ${localConfig.database}`);
      
      pool = new Pool(localConfig);
      const client = await pool.connect();
      console.log(`[DB] Conectado exitosamente a PostgreSQL local.`);
      client.release();
      connected = true;
    } catch (err) {
      if (pool) {
        await pool.end();
        pool = null;
      }

      // If database doesn't exist (Postgres error code '3D000'), attempt to create it
      if (err.code === '3D000') {
        console.log(`[DB] La base de datos '${localConfig.database}' no existe localmente. Intentando crearla...`);
        try {
          const adminPool = new Pool({
            ...localConfig,
            database: 'postgres'
          });
          const adminClient = await adminPool.connect();
          await adminClient.query(`CREATE DATABASE ${localConfig.database}`);
          console.log(`[DB] Base de datos '${localConfig.database}' creada con éxito.`);
          adminClient.release();
          await adminPool.end();

          // Retry connecting after creation
          pool = new Pool(localConfig);
          const client = await pool.connect();
          console.log(`[DB] Conectado exitosamente a PostgreSQL local después de crear la base de datos.`);
          client.release();
          connected = true;
        } catch (createErr) {
          console.warn(`[DB] No se pudo crear la base de datos '${localConfig.database}': ${createErr.message}`);
          if (pool) {
            await pool.end();
            pool = null;
          }
        }
      } else {
        console.warn(`[DB] Error en conexión local con esta configuración: ${err.message}`);
      }
    }
  }

  if (!connected) {
    throw new Error('No se pudo establecer conexión a ninguna base de datos PostgreSQL (remota o local).');
  }

  // Create billboard_config table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billboard_config (
      id SERIAL PRIMARY KEY,
      key_name VARCHAR(50) UNIQUE,
      config_data TEXT,
      version BIGINT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[DB] Tabla billboard_config verificada/creada.');

  // Create users table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      template_name VARCHAR(100) UNIQUE NOT NULL,
      config_data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[DB] Tabla billboard_templates verificada/creada.');

  // Create media_assets table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_data TEXT NOT NULL,
      size_bytes INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[DB] Tabla media_assets verificada/creada.');

  // Create billboard_history table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billboard_history (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      approved_by VARCHAR(50) DEFAULT 'Desconocido',
      modified_by VARCHAR(50) DEFAULT 'Desconocido',
      config_data TEXT NOT NULL,
      version BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[DB] Tabla billboard_history verificada/creada.');

  // Attempt to add columns or indexes if table existed without them
  try {
    await pool.query("ALTER TABLE billboard_history ADD COLUMN approved_by VARCHAR(50) DEFAULT 'Desconocido'");
  } catch (e) { /* Column already exists */ }
  try {
    await pool.query("ALTER TABLE billboard_history ADD COLUMN modified_by VARCHAR(50) DEFAULT 'Desconocido'");
  } catch (e) { /* Column already exists */ }
  try {
    await pool.query("CREATE INDEX IF NOT EXISTS idx_billboard_history_created_at ON billboard_history (created_at DESC)");
  } catch (e) { /* Index already exists or error */ }

  // Seed default admin user if empty
  const userRows = await pool.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(userRows.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO users (username, password, name, allowed_types)
      VALUES ($1, $2, $3, $4)
    `, ['admin', 'admin1234', 'Administrador', JSON.stringify(['*'])]);
    console.log('[DB] Usuario administrador por defecto (admin / admin1234) creado.');
  }

  // Seed default billboard config if empty
  const configRows = await pool.query("SELECT COUNT(*) as count FROM billboard_config WHERE key_name = 'live'");
  if (parseInt(configRows.rows[0].count) === 0) {
    const defaultDataStr = JSON.stringify(defaultBillboardData);
    await pool.query(`
      INSERT INTO billboard_config (key_name, config_data, version)
      VALUES ($1, $2, $3)
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
  const res = await pool.query('SELECT config_data, version FROM billboard_config WHERE key_name = $1', [keyName]);
  if (res.rows.length > 0) {
    return {
      ...JSON.parse(res.rows[0].config_data),
      version: parseInt(res.rows[0].version)
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
    VALUES ($1, $2, $3)
    ON CONFLICT (key_name) DO UPDATE 
    SET config_data = EXCLUDED.config_data, version = EXCLUDED.version
  `, [keyName, jsonStr, version]);
  console.log(`[DB] Configuración '${keyName}' guardada en PostgreSQL. Versión: ${version}`);

  if (keyName === 'live') {
    await pool.query(`
      INSERT INTO billboard_history (username, approved_by, modified_by, config_data, version)
      VALUES ($1, $2, $3, $4, $5)
    `, [approvedBy, approvedBy, modifiedBy, jsonStr, version]);
    console.log(`[DB] Historial registrado en base de datos. Aprobado por: ${approvedBy}`);

    await pool.query(`
      DELETE FROM billboard_history
      WHERE id NOT IN (
        SELECT id FROM billboard_history
        ORDER BY id DESC
        LIMIT 10
      )
    `);
  }
  return true;
}

export async function getVersion(keyName) {
  await ensureDb();
  const res = await pool.query('SELECT version FROM billboard_config WHERE key_name = $1', [keyName]);
  if (res.rows.length > 0) {
    return parseInt(res.rows[0].version);
  }
  return null;
}

// --- User management functions ---

export async function authenticateDbUser(username, password) {
  await ensureDb();
  const res = await pool.query('SELECT username, name, password, allowed_types FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  if (res.rows.length > 0 && res.rows[0].password === password) {
    return {
      username: res.rows[0].username,
      name: res.rows[0].name,
      allowedTypes: JSON.parse(res.rows[0].allowed_types)
    };
  }
  return null;
}

export async function getDbUsers() {
  await ensureDb();
  const res = await pool.query('SELECT username, name, allowed_types FROM users');
  return res.rows.map(r => ({
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
      SET name = $1, allowed_types = $2 
      WHERE LOWER(username) = LOWER($3)
    `, [name, allowedTypesStr, username]);
  } else {
    await pool.query(`
      INSERT INTO users (username, password, name, allowed_types)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO UPDATE 
      SET password = EXCLUDED.password, name = EXCLUDED.name, allowed_types = EXCLUDED.allowed_types
    `, [username, password, name, allowedTypesStr]);
  }
  console.log(`[DB] Usuario '${username}' guardado/actualizado en PostgreSQL.`);
  return true;
}

export async function deleteDbUser(username) {
  await ensureDb();
  if (username.toLowerCase() === 'admin') {
    console.warn('[DB] No se puede eliminar el usuario administrador predeterminado.');
    return false;
  }
  await pool.query('DELETE FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  console.log(`[DB] Usuario '${username}' eliminado de PostgreSQL.`);
  return true;
}

// --- Billboard template functions ---

export async function getDbTemplates() {
  await ensureDb();
  const res = await pool.query('SELECT id, template_name, config_data, created_at FROM billboard_templates ORDER BY created_at DESC');
  return res.rows.map(r => ({
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
    VALUES ($1, $2)
    ON CONFLICT (template_name) DO UPDATE 
    SET config_data = EXCLUDED.config_data
  `, [name, configDataStr]);
  console.log(`[DB] Plantilla '${name}' guardada en PostgreSQL.`);
  return true;
}

export async function deleteDbTemplate(id) {
  await ensureDb();
  if (isNaN(id)) {
    await pool.query('DELETE FROM billboard_templates WHERE template_name = $1', [id]);
  } else {
    await pool.query('DELETE FROM billboard_templates WHERE id = $1', [parseInt(id)]);
  }
  console.log(`[DB] Plantilla '${id}' eliminada de PostgreSQL.`);
  return true;
}

// --- Media Assets Storage Functions ---

export async function saveMediaAsset(filename, mimeType, base64Data, sizeBytes) {
  await ensureDb();
  await pool.query(`
    INSERT INTO media_assets (filename, mime_type, file_data, size_bytes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (filename) DO UPDATE 
    SET mime_type = EXCLUDED.mime_type, file_data = EXCLUDED.file_data, size_bytes = EXCLUDED.size_bytes
  `, [filename, mimeType, base64Data, sizeBytes]);
  console.log(`[DB] Archivo multimedia '${filename}' guardado en PostgreSQL.`);
  return true;
}

export async function getMediaAsset(filename) {
  await ensureDb();
  const res = await pool.query('SELECT mime_type, file_data FROM media_assets WHERE filename = $1', [filename]);
  if (res.rows.length > 0) {
    return {
      mimeType: res.rows[0].mime_type,
      fileData: res.rows[0].file_data
    };
  }
  return null;
}

export async function listMediaAssets() {
  await ensureDb();
  const res = await pool.query('SELECT filename, mime_type, size_bytes, created_at FROM media_assets ORDER BY created_at DESC');
  return res.rows.map(r => ({
    filename: r.filename,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at
  }));
}

export async function deleteMediaAsset(filename) {
  await ensureDb();
  await pool.query('DELETE FROM media_assets WHERE filename = $1', [filename]);
  console.log(`[DB] Archivo '${filename}' eliminado de PostgreSQL.`);
  return true;
}

export async function isUserApprover(username) {
  if (!username) return false;
  await ensureDb();
  if (username.toLowerCase() === 'admin') return true;
  const res = await pool.query('SELECT allowed_types FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  if (res.rows.length > 0) {
    const allowedTypes = JSON.parse(res.rows[0].allowed_types);
    return allowedTypes.includes('approve') || allowedTypes.includes('*');
  }
  return false;
}

export async function getDbHistory() {
  await ensureDb();
  const res = await pool.query('SELECT username, approved_by, modified_by, config_data, version, created_at FROM billboard_history ORDER BY created_at DESC');
  return res.rows.map(r => {
    const parsedConfig = JSON.parse(r.config_data);
    return {
      username: r.username || r.approved_by || parsedConfig.approvedBy || 'Desconocido',
      approved_by: r.approved_by || r.username || parsedConfig.approvedBy || 'Desconocido',
      modified_by: r.modified_by || parsedConfig.modifiedBy || 'Desconocido',
      config_data: parsedConfig,
      version: parseInt(r.version),
      created_at: r.created_at
    };
  });
}
