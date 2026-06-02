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
      id: 'default_hero',
      type: 'media',
      label: 'Media Principal',
      content: { src: '/stadium-hero.png', mediaType: 'image', alt: 'Estadio Copa del Mundo', objectFit: 'contain' },
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
  ],
  layouts: {
    "12x6": {
      grid: { cols: 12, rows: 6 },
      positions: {
        "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
        "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
        "default_hero": { col: 9, row: 1, colSpan: 4, rowSpan: 4 },
        "default_featured": { col: 6, row: 3, colSpan: 3, rowSpan: 3 },
        "default_upcoming": { col: 9, row: 5, colSpan: 4, rowSpan: 1 }
      }
    },
    "9x9": {
      grid: { cols: 9, rows: 9 },
      positions: {
        "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
        "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
        "default_hero": { col: 1, row: 3, colSpan: 5, rowSpan: 4 },
        "default_featured": { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
        "default_upcoming": { col: 5, row: 7, colSpan: 5, rowSpan: 2 }
      }
    }
  },
  orientation: 'horizontal'
};
