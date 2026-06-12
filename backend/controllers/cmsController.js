import { getConfig, saveConfig, getVersion, getDbHistory, deleteDbHistoryEntries, isUserApprover, getDbWorldCupTeams } from '../../db.js';
import { readJsonBody, sendJson } from '../utils.js';
import { broadcastEvent } from './sseController.js';
let cachedLiveConfig = null;
let cachedDraftConfig = null;
let cachedTeams = null;

function parseTeamString(teamStr) {
  if (!teamStr) return '';
  const trimmed = teamStr.trim();
  const emojiRegex = /^([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]|\p{Emoji_Presentation}|\p{Emoji})/u;
  const match = trimmed.match(emojiRegex);
  if (match) {
    return trimmed.slice(match[0].length).trim();
  }
  return trimmed;
}

async function populateFlagsInConfig(config) {
  if (!config || !Array.isArray(config.modules)) return config;

  try {
    const teams = await getDbWorldCupTeams();
    const teamNameToTeam = {};
    const teamFlagToTeam = {};

    const normalizeTeamName = (name) => {
      if (typeof name !== 'string') return '';
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
    };

    teams.forEach(t => {
      if (t.name) {
        teamNameToTeam[normalizeTeamName(t.name)] = t;
      }
      if (t.flag) {
        teamFlagToTeam[t.flag.trim()] = t;
      }
    });

    const getFlagUrl = (teamName, currentFlag) => {
      // 1. If it's already a clean SVG flag URL, don't modify it
      if (typeof currentFlag === 'string' && (currentFlag.startsWith('/paises/') || !isNaN(currentFlag))) {
        return currentFlag;
      }

      // 2. Lookup by name
      if (teamName) {
        const match = teamNameToTeam[normalizeTeamName(teamName)];
        if (match) return `/paises/${match.id}.svg`;
      }

      // 3. Lookup by flag emoji
      if (currentFlag && currentFlag !== '?' && currentFlag !== '??') {
        const match = teamFlagToTeam[currentFlag.trim()];
        if (match) return `/paises/${match.id}.svg`;
      }

      return currentFlag;
    };

    config.modules = config.modules.map(mod => {
      if (!mod || !mod.content) return mod;

      const newMod = { ...mod, content: { ...mod.content } };

      if (mod.type === 'scoreboard') {
        if (newMod.content.teamA) {
          newMod.content.teamA = {
            ...newMod.content.teamA,
            flag: getFlagUrl(newMod.content.teamA.name, newMod.content.teamA.flag)
          };
        }
        if (newMod.content.teamB) {
          newMod.content.teamB = {
            ...newMod.content.teamB,
            flag: getFlagUrl(newMod.content.teamB.name, newMod.content.teamB.flag)
          };
        }
      } else if (mod.type === 'upcoming') {
        const nameA = parseTeamString(newMod.content.teamA);
        const nameB = parseTeamString(newMod.content.teamB);
        newMod.content.flagA = getFlagUrl(nameA, newMod.content.flagA);
        newMod.content.flagB = getFlagUrl(nameB, newMod.content.flagB);
      } else if (mod.type === 'apuesta') {
        if (newMod.content.teamA) {
          newMod.content.teamA = {
            ...newMod.content.teamA,
            flag: getFlagUrl(newMod.content.teamA.name, newMod.content.teamA.flag)
          };
        }
        if (newMod.content.teamB) {
          newMod.content.teamB = {
            ...newMod.content.teamB,
            flag: getFlagUrl(newMod.content.teamB.name, newMod.content.teamB.flag)
          };
        }
      }

      return newMod;
    });
  } catch (err) {
    console.error("[Backend] Error populating flag URLs from DB:", err);
  }

  return config;
}

export function invalidateCmsCache(type = 'all') {
  if (type === 'live' || type === 'all') cachedLiveConfig = null;
  if (type === 'draft' || type === 'all') cachedDraftConfig = null;
  if (type === 'teams' || type === 'all') cachedTeams = null;
}

export async function handleGetCms(req, res) {
  try {
    if (cachedLiveConfig) {
      return sendJson(res, 200, cachedLiveConfig);
    }
    const config = await getConfig('live');
    const processedConfig = await populateFlagsInConfig(config);
    cachedLiveConfig = processedConfig || {};
    sendJson(res, 200, cachedLiveConfig);
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
    invalidateCmsCache('live');
    const processedConfig = await populateFlagsInConfig(config);
    cachedLiveConfig = processedConfig;

    broadcastEvent('update', { version, config: processedConfig });
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

export async function handleDeleteCmsHistory(req, res, parsedUrl) {
  try {
    const versionStr = parsedUrl.searchParams.get('version') || parsedUrl.searchParams.get('versions');
    const username = parsedUrl.searchParams.get('username');
    if (!versionStr) {
      sendJson(res, 400, { error: 'Falta la versión o versiones del historial' });
      return;
    }
    if (username !== 'admin') {
      sendJson(res, 403, { error: 'Acceso denegado: Solo el administrador puede eliminar registros del historial.' });
      return;
    }
    const versions = versionStr.split(',').map(v => v.trim()).filter(Boolean);
    if (versions.length === 0) {
      sendJson(res, 400, { error: 'No se especificaron versiones válidas' });
      return;
    }
    const success = await deleteDbHistoryEntries(versions);
    if (success) {
      sendJson(res, 200, { success: true });
    } else {
      sendJson(res, 500, { error: 'No se pudieron eliminar los registros del historial' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetCmsDraft(req, res) {
  try {
    let config = await getConfig('draft');
    if (!config || !config.modules) {
      config = await getConfig('live');
    }
    const processedConfig = await populateFlagsInConfig(config);
    sendJson(res, 200, processedConfig || {});
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handlePostCmsDraft(req, res) {
  try {
    const { config, modifiedBy } = await readJsonBody(req);
    const version = Date.now();
    await saveConfig('draft', config, version, 'Sistema', modifiedBy || 'Desconocido');
    broadcastEvent('draftUpdate', { version });
    sendJson(res, 200, { success: true, version });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

export async function handleGetWorldCupTeams(req, res) {
  try {
    if (cachedTeams) {
      return sendJson(res, 200, cachedTeams);
    }
    const teams = await getDbWorldCupTeams();
    cachedTeams = teams;
    sendJson(res, 200, teams);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}
