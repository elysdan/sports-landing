import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    default:
      return {};
  }
}

// ─── Default layout matching reference image ───
const defaultModules = [
  {
    id: 'default_brand',
    type: 'media',
    label: 'Logo / Marca',
    gridPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
    content: { src: '', mediaType: 'image', alt: 'Logo', objectFit: 'contain', overlayText: 'miCasino', showBrandOverlay: true },
  },
  {
    id: 'default_scoreboard',
    type: 'scoreboard',
    label: 'Marcador Principal',
    gridPosition: { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
    content: {
      teamA: { name: 'BRASIL', code: 'BRA', score: 1, flag: '🇧🇷' },
      teamB: { name: 'FRANCIA', code: 'FRA', score: 2, flag: '🇫🇷' },
      status: 'FINALIZADO',
    },
  },
  {
    id: 'default_odds',
    type: 'results',
    label: 'Cuotas / Siguiente',
    gridPosition: { col: 1, row: 3, colSpan: 1, rowSpan: 1 },
    content: {
      title: 'SIGUIENTE PARTIDO',
      matches: [
        { teamA: 'INGLATERRA', teamB: 'ALEMANIA', scoreA: 3, scoreB: 1.1 },
      ],
    },
  },
  {
    id: 'default_hero',
    type: 'media',
    label: 'Media Principal',
    gridPosition: { col: 2, row: 1, colSpan: 4, rowSpan: 2 },
    content: { src: '/stadium-hero.png', mediaType: 'image', alt: 'Estadio Copa del Mundo', objectFit: 'contain' },
  },
  {
    id: 'default_news',
    type: 'news',
    label: 'Noticias',
    gridPosition: { col: 1, row: 4, colSpan: 1, rowSpan: 1 },
    content: { title: 'NOTICIAS MUNDIAL', content: 'Las últimas novedades del torneo más importante del mundo.' },
  },
  {
    id: 'default_results',
    type: 'results',
    label: 'Resultados',
    gridPosition: { col: 2, row: 3, colSpan: 2, rowSpan: 2 },
    content: {
      title: 'RESULTADOS DEL PARTIDO',
      matches: [
        { teamA: 'ESPAÑA', teamB: 'PAISES BAJOS', scoreA: 1, scoreB: 3 },
      ],
    },
  },
  {
    id: 'default_featured',
    type: 'media',
    label: 'Resultado Destacado',
    gridPosition: { col: 4, row: 3, colSpan: 1, rowSpan: 2 },
    content: { src: '', mediaType: 'image', alt: 'Resultado Destacado', objectFit: 'contain', overlayText: 'RESULTADOS DEL\nPARTIDO\nESPAÑA 2 — ITALIA 2', showBrandOverlay: false },
  },
  {
    id: 'default_upcoming',
    type: 'upcoming',
    label: 'Próximo Partido',
    gridPosition: { col: 5, row: 3, colSpan: 1, rowSpan: 2 },
    content: { label: 'SIGUIENTE PARTIDO', time: '4:30PM', teamA: 'ESPAÑA', teamB: 'ITALIA' },
  },
  {
    id: 'default_ticker',
    type: 'ticker',
    label: 'Ticker En Vivo',
    gridPosition: { col: 1, row: 5, colSpan: 5, rowSpan: 1 },
    content: {
      isLive: true,
      messages: [
        'GOL DE JAMES - COLOMBIA VS. CHILE',
        'NEYMAR JR. TARJETA AMARILLA',
        'INFORMACIÓN DE ÚLTIMA HORA',
        'MESSI: MEJOR JUGADOR DEL PARTIDO',
      ],
    },
  },
];

const defaultData = {
  modules: defaultModules,
  grid: { cols: 5, rows: 5 },
  orientation: 'horizontal',
};

const CMS_DRAFT_KEY = 'sports-billboard-cms-draft-v4';
const CMS_LIVE_KEY = 'sports-billboard-cms-live-v4';
const CMS_ROLE_KEY = 'sports-billboard-cms-role';
const CMS_USERS_KEY = 'sports-billboard-cms-users-v4';

const defaultUsers = [
  { id: 'user_generic', name: 'Editor General', allowedTypes: ['*'] }
];

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
  const [draftData, setDraftData] = useState(() => loadFromStorage(CMS_DRAFT_KEY));
  const [liveData, setLiveData] = useState(() => loadFromStorage(CMS_LIVE_KEY));
  const [currentVersion, setCurrentVersion] = useState(0);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

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
          setLiveData(migratedLive);

          if (serverDraft && serverDraft.modules) {
            setDraftData(migrateData(serverDraft));
          } else {
            setDraftData(migratedLive);
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
          if (version && version > currentVersion) {
            const dataRes = await fetch('/api/cms');
            if (dataRes.ok) {
              const data = await dataRes.json();
              if (data && data.modules) {
                const migrated = migrateData(data);
                setLiveData(migrated);
                setCurrentVersion(version);
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

  // Debounced auto-save of draftData to PostgreSQL server
  useEffect(() => {
    if (!hasLoadedFromServer || !currentUser) return;

    const timer = setTimeout(async () => {
      try {
        await fetch('/api/cms/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: draftData,
            modifiedBy: currentUser.username
          })
        });
      } catch (e) {
        console.error("[CMS] Error auto-saving draft to database:", e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [draftData, hasLoadedFromServer, currentUser]);

  const CMS_SESSION_KEY = 'sports-billboard-cms-session';

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(CMS_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [users, setUsers] = useState([]);

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

  // Guardar draftData en almacenamiento local
  useEffect(() => {
    try {
      localStorage.setItem(CMS_DRAFT_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Failed to save CMS draft data:', e);
    }
  }, [draftData]);

  // Guardar liveData en almacenamiento local
  useEffect(() => {
    try {
      localStorage.setItem(CMS_LIVE_KEY, JSON.stringify(liveData));
    } catch (e) {
      console.warn('Failed to save CMS live data:', e);
    }
  }, [liveData]);

  // Sincronizar pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.newValue) {
        try {
          if (e.key === CMS_DRAFT_KEY) {
            setDraftData(migrateData(JSON.parse(e.newValue)));
          } else if (e.key === CMS_LIVE_KEY) {
            setLiveData(migrateData(JSON.parse(e.newValue)));
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

  const createTemplate = useCallback(async (name) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: draftData })
      });
      if (res.ok) {
        await fetchTemplates();
        return true;
      }
    } catch (e) {
      console.error("[CMS] Error al crear plantilla:", e);
    }
    return false;
  }, [draftData, fetchTemplates]);

  const applyTemplate = useCallback((templateConfig) => {
    if (templateConfig && templateConfig.modules) {
      setDraftData({
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
    const newModule = {
      id: uid(),
      type,
      label: MODULE_TYPES[type]?.label || 'Módulo',
      gridPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      content: defaultContentForType(type),
      visible: true,
    };
    setDraftData((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
    return newModule.id;
  }, [currentUser]);

  const removeModule = useCallback((id) => {
    setDraftData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const updateModule = useCallback((id, updates) => {
    setDraftData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const updateModuleContent = useCallback((id, contentUpdates) => {
    setDraftData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, content: { ...m.content, ...contentUpdates } } : m
      ),
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const moveModule = useCallback((id, direction) => {
    setDraftData((prev) => {
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
    setDraftData((prev) => {
      const nextGrid = { ...prev.grid, ...gridUpdates };
      const nextModules = prev.modules.map((mod) => {
        let { col, row, colSpan, rowSpan } = mod.gridPosition;

        // Ensure spans do not exceed new grid dimensions
        colSpan = Math.max(1, Math.min(nextGrid.cols, colSpan));
        rowSpan = Math.max(1, Math.min(nextGrid.rows, rowSpan));

        // Ensure start positions fit inside new grid dimensions with the span
        col = Math.max(1, Math.min(nextGrid.cols - colSpan + 1, col));
        row = Math.max(1, Math.min(nextGrid.rows - rowSpan + 1, row));

        return {
          ...mod,
          gridPosition: { col, row, colSpan, rowSpan },
        };
      });

      return {
        ...prev,
        grid: nextGrid,
        modules: nextModules,
        lastModifiedBy: currentUser?.username || 'Desconocido'
      };
    });
  }, [currentUser]);

  const updateOrientation = useCallback((orientation) => {
    setDraftData((prev) => ({
      ...prev,
      orientation,
      lastModifiedBy: currentUser?.username || 'Desconocido'
    }));
  }, [currentUser]);

  const resetAll = useCallback(() => {
    setDraftData(defaultData);
    setLiveData(defaultData);
    setUsers(defaultUsers);
    setRole('admin');
    localStorage.removeItem(CMS_DRAFT_KEY);
    localStorage.removeItem(CMS_LIVE_KEY);
    localStorage.removeItem(CMS_USERS_KEY);
  }, [setRole]);

  const approveAndPublish = useCallback(async () => {
    const nextLive = { ...draftData };
    setLiveData(nextLive);
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: nextLive,
          approvedBy: currentUser?.username || 'Desconocido',
          modifiedBy: draftData.lastModifiedBy || 'Desconocido'
        })
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.version) {
          setCurrentVersion(resData.version);
        }
      }
    } catch (e) {
      console.error("[CMS] Error al guardar en base de datos:", e);
    }
  }, [draftData, currentUser]);

  const discardDraft = useCallback(() => {
    setDraftData(liveData);
  }, [liveData]);

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
        currentUser,
        login,
        logout,
        role,
        setRole,
        users,
        createEditor,
        deleteEditor,
        hasPermission,
        hasPendingChanges: JSON.stringify(draftData) !== JSON.stringify(liveData),
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
