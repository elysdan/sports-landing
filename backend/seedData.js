export const defaultBillboardData = {
  modules: [
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
      content: { src: '', mediaType: 'image', alt: 'Resultado Destacado', objectFit: 'contain', overlayText: "RESULTADOS DEL\nPARTIDO\nESPAÑA 2 — ITALIA 2", showBrandOverlay: false },
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
  ],
  grid: { cols: 5, rows: 5 },
  orientation: 'horizontal',
};
