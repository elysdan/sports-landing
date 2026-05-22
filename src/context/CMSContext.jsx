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

const CMS_STORAGE_KEY = 'sports-billboard-cms-v3';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(CMS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate existing modules with 'cover' to 'contain' to ensure user's active layout is automatically adjusted
      if (parsed && Array.isArray(parsed.modules)) {
        parsed.modules = parsed.modules.map((mod) => {
          if (mod.type === 'media' && mod.content) {
            if (!mod.content.objectFit || mod.content.objectFit === 'cover') {
              mod.content.objectFit = 'contain';
            }
          }
          return mod;
        });
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load CMS data:', e);
  }
  return defaultData;
}

const CMSContext = createContext(null);

export function CMSProvider({ children }) {
  const [data, setData] = useState(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save CMS data:', e);
    }
  }, [data]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CMS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setData(parsed);
        } catch (err) {
          console.warn('Failed to parse synced CMS data:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addModule = useCallback((type) => {
    const newModule = {
      id: uid(),
      type,
      label: MODULE_TYPES[type]?.label || 'Módulo',
      gridPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      content: defaultContentForType(type),
      visible: true,
    };
    setData((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));
    return newModule.id;
  }, []);

  const removeModule = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
    }));
  }, []);

  const updateModule = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const updateModuleContent = useCallback((id, contentUpdates) => {
    setData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, content: { ...m.content, ...contentUpdates } } : m
      ),
    }));
  }, []);

  const moveModule = useCallback((id, direction) => {
    setData((prev) => {
      const modules = [...prev.modules];
      const idx = modules.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= modules.length) return prev;
      [modules[idx], modules[newIdx]] = [modules[newIdx], modules[idx]];
      return { ...prev, modules };
    });
  }, []);

  const updateGrid = useCallback((gridUpdates) => {
    setData((prev) => {
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
      };
    });
  }, []);

  const updateOrientation = useCallback((orientation) => {
    setData((prev) => ({
      ...prev,
      orientation,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData(defaultData);
    localStorage.removeItem(CMS_STORAGE_KEY);
  }, []);

  return (
    <CMSContext.Provider
      value={{
        data,
        addModule,
        removeModule,
        updateModule,
        updateModuleContent,
        moveModule,
        updateGrid,
        updateOrientation,
        resetAll,
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
