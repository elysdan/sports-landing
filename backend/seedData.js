export const defaultBillboardData = {
  activeLayout: "12x6",
  modules: [
    {
      id: 'default_brand',
      type: 'media',
      label: 'Logo / Marca',
      content: { src: '', mediaType: 'image', alt: 'Logo', objectFit: 'contain', overlayText: 'miCasino', showBrandOverlay: true },
      visible: true
    },
    {
      id: 'default_scoreboard',
      type: 'scoreboard',
      label: 'Marcador Principal',
      content: {
        teamA: { name: 'BRASIL', code: 'BRA', score: 1, flag: '🇧🇷' },
        teamB: { name: 'FRANCIA', code: 'FRA', score: 2, flag: '🇫🇷' },
        status: 'FINALIZADO',
      },
      visible: true
    },
    {
      id: 'default_odds',
      type: 'results',
      label: 'Cuotas / Siguiente',
      content: {
        title: 'SIGUIENTE PARTIDO',
        matches: [
          { teamA: 'INGLATERRA', teamB: 'ALEMANIA', scoreA: 3, scoreB: 1.1 },
        ],
      },
      visible: true
    },
    {
      id: 'default_hero',
      type: 'media',
      label: 'Media Principal',
      content: { src: '/stadium-hero.png', mediaType: 'image', alt: 'Estadio Copa del Mundo', objectFit: 'contain' },
      visible: true
    },
    {
      id: 'default_news',
      type: 'news',
      label: 'Noticias',
      content: { title: 'NOTICIAS MUNDIAL', content: 'Las últimas novedades del torneo más importante del mundo.' },
      visible: true
    },
    {
      id: 'default_results',
      type: 'results',
      label: 'Resultados',
      content: {
        title: 'RESULTADOS DEL PARTIDO',
        matches: [
          { teamA: 'ESPAÑA', teamB: 'PAISES BAJOS', scoreA: 1, scoreB: 3 },
        ],
      },
      visible: true
    },
    {
      id: 'default_featured',
      type: 'media',
      label: 'Resultado Destacado',
      content: { src: '', mediaType: 'image', alt: 'Resultado Destacado', objectFit: 'contain', overlayText: "RESULTADOS DEL\nPARTIDO\nESPAÑA 2 — ITALIA 2", showBrandOverlay: false },
      visible: true
    },
    {
      id: 'default_upcoming',
      type: 'upcoming',
      label: 'Próximo Partido',
      content: { label: 'SIGUIENTE PARTIDO', time: '4:30PM', teamA: 'ESPAÑA', teamB: 'ITALIA' },
      visible: true
    },
    {
      id: 'default_ticker',
      type: 'ticker',
      label: 'Ticker En Vivo',
      content: {
        isLive: true,
        messages: [
          'GOL DE JAMES - COLOMBIA VS. CHILE',
          'NEYMAR JR. TARJETA AMARILLA',
          'INFORMACIÓN DE ÚLTIMA HORA',
          'MESSI: MEJOR JUGADOR DEL PARTIDO',
        ],
      },
      visible: true
    },
  ],
  layouts: {
    "12x6": {
      grid: { cols: 12, rows: 6 },
      positions: {
        "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
        "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
        "default_odds": { col: 6, row: 1, colSpan: 3, rowSpan: 2 },
        "default_hero": { col: 9, row: 1, colSpan: 4, rowSpan: 4 },
        "default_news": { col: 1, row: 2, colSpan: 2, rowSpan: 4 },
        "default_results": { col: 3, row: 3, colSpan: 3, rowSpan: 3 },
        "default_featured": { col: 6, row: 3, colSpan: 3, rowSpan: 3 },
        "default_upcoming": { col: 9, row: 5, colSpan: 4, rowSpan: 1 },
        "default_ticker": { col: 1, row: 6, colSpan: 12, rowSpan: 1 }
      }
    },
    "9x9": {
      grid: { cols: 9, rows: 9 },
      positions: {
        "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
        "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
        "default_odds": { col: 6, row: 1, colSpan: 4, rowSpan: 2 },
        "default_hero": { col: 1, row: 3, colSpan: 5, rowSpan: 4 },
        "default_news": { col: 6, row: 3, colSpan: 4, rowSpan: 2 },
        "default_results": { col: 6, row: 5, colSpan: 4, rowSpan: 2 },
        "default_featured": { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
        "default_upcoming": { col: 5, row: 7, colSpan: 5, rowSpan: 2 },
        "default_ticker": { col: 1, row: 9, colSpan: 9, rowSpan: 1 }
      }
    }
  },
  orientation: 'horizontal'
};
