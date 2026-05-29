import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { defaultBillboardData as defaultData } from '../../backend/seedData.js';

// ─── Generate unique IDs ───
let _idCounter = 0;
function uid() {
  return `mod_${Date.now()}_${++_idCounter}`;
}

// ─── Module type definitions ───
export const MODULE_TYPES = {
  media: { label: 'Multimedia', icon: '🖼️', description: 'Imagen, GIF o Video MP4' },
  scoreboard: { label: 'Marcador', icon: '⚽', description: 'Resultado de partido en vivo' },
  results: { label: 'Resultados', icon: '📊', description: 'Tabla de resultados' },
  upcoming: { label: 'Próximo Partido', icon: '📅', description: 'Próximo encuentro con horario' },
  news: { label: 'Noticias', icon: '📰', description: 'Texto informativo / noticias' },
  ticker: { label: 'Ticker En Vivo', icon: '📡', description: 'Barra de noticias en vivo (fila completa)' },
  apuesta: { label: 'Apuesta', icon: '🪙', description: 'Tarjeta de apuestas (1X2)' },
  pregunta: { label: 'Apuesta Sí/No', icon: '❓', description: 'Apuesta con respuesta Sí/No' },
};

// ─── Default content per module type ───
function defaultContentForType(type) {
  switch (type) {
    case 'media':
      return { src: '', mediaType: 'image', alt: 'Contenido multimedia', objectFit: 'contain' };
    case 'scoreboard':
      return {
        teamA: { name: 'EQUIPO A', code: 'EQA', score: 0, flag: '🏳️' },
        teamB: { name: 'EQUIPO B', code: 'EQB', score: 0, flag: '🏳️' },
        status: 'EN VIVO',
      };
    case 'results':
      return {
        title: 'RESULTADOS DEL PARTIDO',
        matches: [{ teamA: 'EQUIPO A', teamB: 'EQUIPO B', scoreA: 0, scoreB: 0 }],
      };
    case 'upcoming':
      return { label: 'SIGUIENTE PARTIDO', time: '0:00PM', teamA: 'EQUIPO A', teamB: 'EQUIPO B' };
    case 'news':
      return { title: 'NOTICIAS', content: 'Contenido de la noticia aquí...' };
    case 'ticker':
      return {
        isLive: true,
        messages: ['Noticia en vivo #1', 'Noticia en vivo #2'],
      };
    case 'apuesta':
      return {
        title: '¡MÁXIMA GANANCIA CON MÉXICO!',
        tag: 'Primer gol',
        mode: '3-way',
        teamA: { name: 'México', flag: '🇲🇽', odd: '1,46' },
        draw: { odd: '4,25' },
        teamB: { name: 'Sudáfrica', flag: '🇿🇦', odd: '6,66' }
      };
    case 'pregunta':
      return {
        title: '¿AMBOS EQUIPOS ANOTARÁN?',
        tag: 'Especiales de fútbol',
        yesOdd: '1,85',
        noOdd: '1,95',
      };
    default:
      return {};
  }
}

const CMS_DRAFT_KEY = 'sports-billboard-cms-draft-v5';
const CMS_LIVE_KEY = 'sports-billboard-cms-live-v5';
const CMS_ROLE_KEY = 'sports-billboard-cms-role';
const CMS_USERS_KEY = 'sports-billboard-cms-users-v5';

const defaultUsers = [
  { id: 'user_generic', name: 'Editor General', allowedTypes: ['*'] }
];

// Helper to generate safe coordinates for old layouts being migrated
function createDefaultPositions(modules, targetCols, targetRows, originalGrid, originalPositions) {
  const positions = {};
  
  const defaults_12x6 = {
    "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
    "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
    "default_odds": { col: 6, row: 1, colSpan: 3, rowSpan: 2 },
    "default_hero": { col: 9, row: 1, colSpan: 4, rowSpan: 4 },
    "default_news": { col: 1, row: 2, colSpan: 2, rowSpan: 4 },
    "default_results": { col: 3, row: 3, colSpan: 3, rowSpan: 3 },
    "default_featured": { col: 6, row: 3, colSpan: 3, rowSpan: 3 },
    "default_upcoming": { col: 9, row: 5, colSpan: 4, rowSpan: 1 },
    "default_ticker": { col: 1, row: 6, colSpan: 12, rowSpan: 1 }
  };

  const defaults_9x9 = {
    "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
    "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
    "default_odds": { col: 6, row: 1, colSpan: 4, rowSpan: 2 },
    "default_hero": { col: 1, row: 3, colSpan: 5, rowSpan: 4 },
    "default_news": { col: 6, row: 3, colSpan: 4, rowSpan: 2 },
    "default_results": { col: 6, row: 5, colSpan: 4, rowSpan: 2 },
    "default_featured": { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
    "default_upcoming": { col: 5, row: 7, colSpan: 5, rowSpan: 2 },
    "default_ticker": { col: 1, row: 9, colSpan: 9, rowSpan: 1 }
  };

  const layoutDefaults = (targetCols === 12 && targetRows === 6) ? defaults_12x6 : defaults_9x9;

  modules.forEach(mod => {
    if (layoutDefaults[mod.id]) {
      positions[mod.id] = { ...layoutDefaults[mod.id] };
    } else if (originalPositions[mod.id]) {
      let { col, row, colSpan, rowSpan } = originalPositions[mod.id];
      colSpan = Math.max(1, Math.min(targetCols, colSpan));
      rowSpan = Math.max(1, Math.min(targetRows, rowSpan));
      col = Math.max(1, Math.min(targetCols - colSpan + 1, col));
      row = Math.max(1, Math.min(targetRows - rowSpan + 1, row));
      positions[mod.id] = { col, row, colSpan, rowSpan };
    } else {
      positions[mod.id] = { col: 1, row: 1, colSpan: 1, rowSpan: 1 };
    }
  });

  return positions;
}

function migrateData(parsed) {
  if (!parsed || !Array.isArray(parsed.modules)) {
    return defaultData;
  }
  parsed.modules = parsed.modules.map((mod) => {
    if (mod.type === 'media' && mod.content) {
      if (!mod.content.objectFit) {
        mod.content.objectFit = 'contain';
      }
    }
    return mod;
  });

  // Automated migration: If layouts structure doesn't exist, create it and map old coordinates
  if (!parsed.layouts) {
    const originalGrid = parsed.grid || { cols: 5, rows: 5 };
    const originalPositions = {};
    parsed.modules.forEach(mod => {
      originalPositions[mod.id] = mod.gridPosition || { col: 1, row: 1, colSpan: 1, rowSpan: 1 };
    });

    parsed.layouts = {
      "12x6": {
        grid: { cols: 12, rows: 6 },
        positions: createDefaultPositions(parsed.modules, 12, 6, originalGrid, originalPositions)
      },
      "9x9": {
        grid: { cols: 9, rows: 9 },
        positions: createDefaultPositions(parsed.modules, 9, 9, originalGrid, originalPositions)
      }
    };
    parsed.activeLayout = "12x6";
  }

  return parsed;
}

function loadFromStorage(key) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateData(parsed);
    }
  } catch (e) {
    console.warn(`Failed to load CMS data for ${key}:`, e);
  }
  return defaultData;
}

const CMSContext = createContext(null);

export function CMSProvider({ children }) {
  const CMS_SESSION_KEY = 'sports-billboard-cms-session';
  const isEditor = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(CMS_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [rawDraftData, setRawDraftData] = useState(() => loadFromStorage(CMS_DRAFT_KEY));
  const [rawLiveData, setRawLiveData] = useState(() => loadFromStorage(CMS_LIVE_KEY));
  const [currentVersion, setCurrentVersion] = useState(0);
  const [currentDraftVersion, setCurrentDraftVersion] = useState(0);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  const isLocalChange = useRef(false);
  const setLocalDraftData = useCallback((val) => {
    isLocalChange.current = true;
    setRawDraftData(val);
  }, []);

  // Fetch initial layout data from database on mount
  useEffect(() => {
    async function loadServerData() {
      try {
        const resLive = await fetch('/api/cms');
        let serverLive = null;
        if (resLive.ok) {
          serverLive = await resLive.json();
        }

        const resDraft = await fetch('/api/cms/draft');
        let serverDraft = null;
        if (resDraft.ok) {
          serverDraft = await resDraft.json();
        }

        if (serverLive && serverLive.modules) {
          const migratedLive = migrateData(serverLive);
          setRawLiveData(migratedLive);

          if (serverDraft && serverDraft.modules) {
            const migratedDraft = migrateData(serverDraft);
            setRawDraftData(migratedDraft);
            if (migratedDraft.version) {
              setCurrentDraftVersion(migratedDraft.version);
            }
          } else {
            setRawDraftData(migratedLive);
            if (migratedLive.version) {
              setCurrentDraftVersion(migratedLive.version);
            }
          }

          if (migratedLive.version) {
            setCurrentVersion(migratedLive.version);
          }
        }
        setHasLoadedFromServer(true);
      } catch (e) {
        console.warn("[CMS] Fallback to localStorage: no se pudo cargar desde el servidor.", e);
        setHasLoadedFromServer(true);
      }
    }
    loadServerData();
  }, []);

  // Polling to sync liveData in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/cms/version');
        if (res.ok) {
          const { version } = await res.json();
          if (version && Number(version) > Number(currentVersion)) {
            const dataRes = await fetch('/api/cms');
            if (dataRes.ok) {
              const data = await dataRes.json();
              if (data && data.modules) {
                const migrated = migrateData(data);
                setRawLiveData(migrated);
                setCurrentVersion(Number(version));
                console.log(`[CMS] Vista actualizada a la versión: ${version}`);
              }
            }
          }
        }
      } catch (e) {
        // Silently fail to avoid console flooding on offline
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentVersion]);

  // Polling to sync draftData in real-time (only for display screens where user is not logged in)
  useEffect(() => {
    if (isEditor) return; // Do not poll draft if we are the editor tab

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/cms/draft');
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && Number(data.version) > Number(currentDraftVersion)) {
            const migrated = migrateData(data);
            setRawDraftData(migrated);
            setCurrentDraftVersion(Number(data.version));
            console.log(`[CMS] Borrador en pantalla actualizado a la versión: ${data.version}`);
          }
        }
      } catch (e) {
        // Silently fail
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentDraftVersion, currentUser]);



  // Save rawDraftData in local storage immediately and debounced auto-save to database
  useEffect(() => {
    if (!isEditor || !isLocalChange.current) return;

    // 1. Immediate local storage save
    try {
      localStorage.setItem(CMS_DRAFT_KEY, JSON.stringify(rawDraftData));
    } catch (e) {
      console.warn('Failed to save CMS draft data:', e);
    }

    // 2. Debounce database save
    if (!hasLoadedFromServer || !currentUser) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/cms/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: rawDraftData,
            modifiedBy: currentUser.username
          })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.version) {
            setCurrentDraftVersion(Number(resData.version));
          }
        }
      } catch (e) {
        console.error("[CMS] Error auto-saving draft to database:", e);
      }
      isLocalChange.current = false;
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [rawDraftData, hasLoadedFromServer, currentUser, isEditor]);

  const [users, setUsers] = useState([]);
  const [worldCupTeams, setWorldCupTeams] = useState([]);

  const fetchWorldCupTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/worldcup-teams');
      if (res.ok) {
        const data = await res.json();
        setWorldCupTeams(data);
      }
    } catch (e) {
      console.error("[CMS] Error al cargar equipos del mundial:", e);
    }
  }, []);

  useEffect(() => {
    fetchWorldCupTeams();
  }, [fetchWorldCupTeams]);

  const role = currentUser ? (currentUser.username === 'admin' ? 'admin' : currentUser.username) : null;
  const setRole = useCallback(() => {}, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("[CMS] Error al cargar los usuarios:", e);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [currentUser, fetchUsers]);

  // Save rawLiveData in local storage
  useEffect(() => {
    if (!isEditor) return; // Only write if editor is active
    try {
      localStorage.setItem(CMS_LIVE_KEY, JSON.stringify(rawLiveData));
    } catch (e) {
      console.warn('Failed to save CMS live data:', e);
    }
  }, [rawLiveData, isEditor]);

  // Sync tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.newValue) {
        try {
          if (e.key === CMS_DRAFT_KEY) {
            setRawDraftData(migrateData(JSON.parse(e.newValue)));
          } else if (e.key === CMS_LIVE_KEY) {
            setRawLiveData(migrateData(JSON.parse(e.newValue)));
          } else if (e.key === CMS_SESSION_KEY) {
            setCurrentUser(JSON.parse(e.newValue));
          }
        } catch (err) {
          console.warn('Failed to parse synced CMS data:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem(CMS_SESSION_KEY, JSON.stringify(user));
        return { success: true };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Acceso incorrecto' };
      }
    } catch (e) {
      return { success: false, error: 'Error de red o conexión al servidor' };
    }
  }, []);

  const [history, setHistory] = useState([]);

  const fetchHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/cms/history?username=${encodeURIComponent(currentUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("[CMS] Error al cargar el historial:", e);
    }
  }, [currentUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setHistory([]);
    localStorage.removeItem(CMS_SESSION_KEY);
  }, []);

  const [templates, setTemplates] = useState([]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error("[CMS] Error al cargar las plantillas:", e);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTemplates();
    } else {
      setTemplates([]);
    }
  }, [currentUser, fetchTemplates]);

  // Switch the layout currently being edited
  const switchLayout = useCallback((layoutName) => {
    setLocalDraftData((prev) => ({
      ...prev,
      activeLayout: layoutName
    }));
  }, []);

  // Map raw data onto exposed structure based on activeLayout
  const activeLayoutName = rawDraftData.activeLayout || '12x6';
  const activeLayoutObj = rawDraftData.layouts?.[activeLayoutName] || { grid: { cols: 12, rows: 6 }, positions: {} };

  const draftData = {
    ...rawDraftData,
    grid: activeLayoutObj.grid,
    modules: rawDraftData.modules.map(mod => ({
      ...mod,
      gridPosition: activeLayoutObj.positions?.[mod.id] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
    }))
  };

  const liveLayoutObj = rawLiveData.layouts?.[activeLayoutName] || { grid: { cols: 12, rows: 6 }, positions: {} };
  const liveData = {
    ...rawLiveData,
    grid: liveLayoutObj.grid,
    modules: rawLiveData.modules.map(mod => ({
      ...mod,
      gridPosition: liveLayoutObj.positions?.[mod.id] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
    }))
  };

  const createTemplate = useCallback(async (name) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: rawDraftData })
      });
      if (res.ok) {
        await fetchTemplates();
        return true;
      }
    } catch (e) {
      console.error("[CMS] Error al crear plantilla:", e);
    }
    return false;
  }, [rawDraftData, fetchTemplates]);

  const applyTemplate = useCallback((templateConfig) => {
    if (templateConfig && templateConfig.modules) {
      setLocalDraftData({
        ...migrateData(templateConfig),
        lastModifiedBy: currentUser?.username || 'Desconocido'
      });
      return true;
    }
    return false;
  }, [currentUser]);

  const deleteTemplate = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTemplates();
        return true;
      }
    } catch (e) {
      console.error("[CMS] Error al eliminar plantilla:", e);
    }
    return false;
  }, [fetchTemplates]);

  const addModule = useCallback((type) => {
    const id = uid();
    const newModule = {
      id,
      type,
      label: MODULE_TYPES[type]?.label || 'Módulo',
      content: defaultContentForType(type),
      visible: true,
    };
    
    setLocalDraftData((prev) => {
      const updatedLayouts = { ...prev.layouts };
      Object.keys(updatedLayouts).forEach(layKey => {
        updatedLayouts[layKey] = {
          ...updatedLayouts[layKey],
          positions: {
            ...updatedLayouts[layKey].positions,
            [id]: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
          }
        };
      });

      return {
        ...prev,
        modules: [newModule, ...prev.modules],
        layouts: updatedLayouts,
        lastModifiedBy: currentUser?.username || 'Desconocido'
      };
    });
    return id;
  }, [currentUser]);

  const removeModule = useCallback((id) => {
    setLocalDraftData((prev) => {
      const updatedLayouts = { ...prev.layouts };
      Object.keys(updatedLayouts).forEach(layKey => {
        const nextPositions = { ...updatedLayouts[layKey].positions };
        delete nextPositions[id];
        updatedLayouts[layKey] = {
          ...updatedLayouts[layKey],
          positions: nextPositions
        };
      });

      return {
        ...prev,
        modules: prev.modules.filter((m) => m.id !== id),
        layouts: updatedLayouts,
        lastModifiedBy: currentUser?.username || 'Desconocido'
      };
    });
  }, [currentUser]);

  const updateModule = useCallback((id, updates) => {
    setLocalDraftData((prev) => {
      const activeLay = prev.activeLayout || '12x6';
      
      if (updates.gridPosition) {
        const updatedLayouts = { ...prev.layouts };
        updatedLayouts[activeLay] = {
          ...updatedLayouts[activeLay],
          positions: {
            ...updatedLayouts[activeLay].positions,
            [id]: { ...updatedLayouts[activeLay].positions[id], ...updates.gridPosition }
          }
        };

        const { gridPosition, ...restUpdates } = updates;
        return {
          ...prev,
          layouts: updatedLayouts,
          modules: prev.modules.map((m) =>
            m.id === id ? { ...m, ...restUpdates } : m
          ),
          lastModifiedBy: currentUser?.username || 'Desconocido'
        };
      }

      return {
        ...prev,
        modules: prev.modules.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
        lastModifiedBy: currentUser?.username || 'Desconocido'
      };
    });
  }, [currentUser]);

  const updateModuleContent = useCallback((id, contentUpdates) => {
    setLocalDraftData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, content: { ...m.content, ...contentUpdates } } : m
      ),
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const moveModule = useCallback((id, direction) => {
    setLocalDraftData((prev) => {
      const modules = [...prev.modules];
      const idx = modules.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= modules.length) return prev;
      [modules[idx], modules[newIdx]] = [modules[newIdx], modules[idx]];
      return { ...prev, modules, lastModifiedBy: currentUser?.username || 'Desconocido' };
    });
  }, [currentUser]);

  const updateGrid = useCallback((gridUpdates) => {
    setLocalDraftData((prev) => {
      const activeLay = prev.activeLayout || '12x6';
      const updatedLayouts = { ...prev.layouts };
      const nextGrid = { ...updatedLayouts[activeLay].grid, ...gridUpdates };

      const nextPositions = { ...updatedLayouts[activeLay].positions };
      Object.keys(nextPositions).forEach(modId => {
        let { col, row, colSpan, rowSpan } = nextPositions[modId] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 };
        colSpan = Math.max(1, Math.min(nextGrid.cols, colSpan));
        rowSpan = Math.max(1, Math.min(nextGrid.rows, rowSpan));
        col = Math.max(1, Math.min(nextGrid.cols - colSpan + 1, col));
        row = Math.max(1, Math.min(nextGrid.rows - rowSpan + 1, row));
        nextPositions[modId] = { col, row, colSpan, rowSpan };
      });

      updatedLayouts[activeLay] = {
        ...updatedLayouts[activeLay],
        grid: nextGrid,
        positions: nextPositions
      };

      return {
        ...prev,
        layouts: updatedLayouts,
        lastModifiedBy: currentUser?.username || 'Desconocido'
      };
    });
  }, [currentUser]);

  const updateOrientation = useCallback((orientation) => {
    setLocalDraftData((prev) => ({
      ...prev,
      orientation,
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const resetAll = useCallback(() => {
    setLocalDraftData(defaultData);
    setRawLiveData(defaultData);
    setUsers(defaultUsers);
    setRole('admin');
    localStorage.removeItem(CMS_DRAFT_KEY);
    localStorage.removeItem(CMS_LIVE_KEY);
    localStorage.removeItem(CMS_USERS_KEY);
  }, [setRole]);

  const approveAndPublish = useCallback(async () => {
    const nextLive = { ...rawDraftData };
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: nextLive,
          approvedBy: currentUser?.username || 'Desconocido',
          modifiedBy: rawDraftData.lastModifiedBy || 'Desconocido'
        })
      });
      if (res.ok) {
        const resData = await res.json();
        setRawLiveData(nextLive);
        if (resData.version) {
          setCurrentVersion(Number(resData.version));
        }
        alert('¡Configuración publicada exitosamente!');
      } else {
        const errData = await res.json();
        alert('Error al publicar: ' + (errData.error || 'Error desconocido del servidor.'));
      }
    } catch (e) {
      console.error("[CMS] Error al guardar en base de datos:", e);
      alert('Error de red al intentar guardar en base de datos: ' + e.message);
    }
  }, [rawDraftData, currentUser]);

  const discardDraft = useCallback(() => {
    setLocalDraftData(rawLiveData);
  }, [rawLiveData]);

  const createEditor = useCallback(async (username, password, name, allowedTypes) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, allowedTypes })
      });
      if (res.ok) {
        await fetchUsers();
        return true;
      }
    } catch (e) {
      console.error("[CMS] Error al crear editor:", e);
    }
    return false;
  }, [fetchUsers]);

  const deleteEditor = useCallback(async (username) => {
    try {
      const res = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchUsers();
        return true;
      }
    } catch (e) {
      console.error("[CMS] Error al eliminar editor:", e);
    }
    return false;
  }, [fetchUsers]);

  const hasPermission = useCallback((type) => {
    if (!currentUser) return false;
    if (currentUser.allowedTypes.includes('readonly_media_add')) return false;
    if (
      currentUser.username === 'admin' || 
      currentUser.allowedTypes.includes('*') || 
      currentUser.allowedTypes.includes('approve')
    ) return true;
    return currentUser.allowedTypes.includes(type);
  }, [currentUser]);

  return (
    <CMSContext.Provider
      value={{
        draftData,
        liveData,
        rawLiveData,
        rawDraftData,
        currentUser,
        login,
        logout,
        role,
        setRole,
        users,
        createEditor,
        deleteEditor,
        hasPermission,
        hasPendingChanges: JSON.stringify(rawDraftData) !== JSON.stringify(rawLiveData),
        hasLoadedFromServer,
        approveAndPublish,
        discardDraft,
        addModule,
        removeModule,
        updateModule,
        updateModuleContent,
        moveModule,
        updateGrid,
        updateOrientation,
        resetAll,
        templates,
        createTemplate,
        applyTemplate,
        deleteTemplate,
        history,
        fetchHistory,
        activeLayout: rawDraftData.activeLayout || '12x6',
        switchLayout,
        worldCupTeams
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error('useCMS must be used within CMSProvider');
  return ctx;
}

export { defaultData, defaultContentForType };
