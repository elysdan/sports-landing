import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';

/* ─── Render a single module based on its type ─── */
export function RenderModule({ module, gridPosition, gridCols = 12, gridRows = 6, isLivePreview = false }) {
  const gp = gridPosition || module.gridPosition || { colSpan: 1, rowSpan: 1 };
  const colSpan = gp.colSpan || 1;
  const rowSpan = gp.rowSpan || 1;
  
  // Calculate relative proportions of the grid that the module occupies
  const colFraction = colSpan / gridCols;
  const rowFraction = rowSpan / gridRows;
  
  // Normalize colFraction by aspect ratio (approx. 16:9 = 1.777) to match physical proportions
  const sizeFactor = Math.min(colFraction * 1.777, rowFraction);
  
  // Scale factor that is highly responsive to container dimensions.
  // In vertical layouts, we scale based on row fraction to prevent giant text overflows.
  const isVerticalLayout = gridCols === 1 || (window.innerWidth < window.innerHeight);
  
  // Calculate viewport scaling multiplier (base design resolution is 1920x1080 horizontal or 1080x1920 vertical)
  const baseWidth = isVerticalLayout ? 1080 : 1920;
  const actualWidth = isLivePreview ? baseWidth : window.innerWidth;
  const viewportScale = actualWidth / baseWidth;

  const baseScale = isVerticalLayout
    ? (0.45 + (rowFraction * 1.5))
    : (0.12 + (sizeFactor * 2.8) + (Math.min(colFraction, rowFraction * 1.8) * 0.6));

  const scale = baseScale * viewportScale;
  const content = module.content || {};

  const wrapperStyle = {
    '--scale': scale,
    '--text-scale-factor': content.textSizeFactor !== undefined ? content.textSizeFactor : 1.0,
    '--card-bg-color': content.cardBgColor || 'rgba(255, 255, 255, 0.03)',
    '--module-bg-color': content.moduleBgTransparent === true ? 'transparent' : (content.moduleBgColor || content.cardBgColor || '#0a0a0a'),
    '--module-border-color': content.moduleBorderTransparent === true ? 'transparent' : (content.moduleBorderColor || 'var(--color-border)'),
    ...(content.textColor ? { '--text-color': content.textColor } : {}),
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0
  };

  const wrapperClass = [
    'module-wrapper',
    `span-w-${colSpan}`,
    `span-h-${rowSpan}`,
    colSpan <= 4 ? `narrow-col-${colSpan}` : '',
    rowSpan === 1 ? 'short-row-1' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {(() => {
        switch (module.type) {
          case 'media':
            return <MediaModule content={module.content} />;
          case 'scoreboard':
            return <ScoreboardModule content={module.content} />;
          case 'results':
            return <ResultsModule content={module.content} />;
          case 'upcoming':
            return <UpcomingModule content={module.content} />;
          case 'news':
            return <NewsModule content={module.content} />;
          case 'ticker':
            return <TickerModule content={module.content} />;
          case 'apuesta':
            return <ApuestaModule content={module.content} />;
          case 'pregunta':
            return <PreguntaModule content={module.content} />;
          default:
            return <div className="module-media"><div className="media-placeholder"><div className="media-placeholder-icon">❓</div>Módulo desconocido</div></div>;
        }
      })()}
    </div>
  );
}

/* ─── MEDIA MODULE ─── */
function MediaModule({ content }) {
  const objectFitStyle = content.objectFit || 'contain';

  if (content.showBrandOverlay) {
    return (
      <div className="module-media">
        {content.src && (
          <>
            {isVideo(content.src, content.mediaType) ? (
              <video className={`media-content ${objectFitStyle}`} style={{ objectFit: objectFitStyle }} src={content.src} autoPlay muted loop playsInline />
            ) : (
              <img className={`media-content ${objectFitStyle}`} style={{ objectFit: objectFitStyle }} src={content.src} alt={content.alt || ''} />
            )}
          </>
        )}
        <div className="brand-overlay">
          <div className="brand-icon">♣</div>
          <div className="brand-name-display">{content.overlayText || 'miCasino'}</div>
        </div>
      </div>
    );
  }

  // Si no hay imagen pero hay texto overlay, mostrar como tarjeta de anuncio premium
  if (!content.src && content.overlayText) {
    return (
      <div className="module-media media-text-only">
        <div className="media-text-glow" />
        <div className="media-text-container">
          <div className="media-text-title">INFO DESTACADA</div>
          <div className="media-text-content">{content.overlayText}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-media">
      {content.src ? (
        <>
          {isVideo(content.src, content.mediaType) ? (
            <video className={`media-content ${objectFitStyle}`} style={{ objectFit: objectFitStyle }} src={content.src} autoPlay muted loop playsInline />
          ) : (
            <img className={`media-content ${objectFitStyle}`} style={{ objectFit: objectFitStyle }} src={content.src} alt={content.alt || ''} />
          )}
          <div className="media-overlay" />
          {content.overlayText && (
            <div className="media-overlay-text">{content.overlayText}</div>
          )}
        </>
      ) : (
        <div className="media-placeholder">
          <div className="media-placeholder-icon">🖼️</div>
          MULTIMEDIA
        </div>
      )}
    </div>
  );
}

function isVideo(src, mediaType) {
  if (mediaType === 'video') return true;
  if (!src) return false;
  return src.match(/\.(mp4|webm|ogg)(\?|$)/i) || src.startsWith('data:video');
}

export function TeamFlag({ flag }) {
  if (!flag) return null;
  const isUrl = flag.startsWith('/') || flag.startsWith('http') || flag.includes('.') || flag.startsWith('data:image');
  if (isUrl) {
    return (
      <img
        src={flag}
        alt="Flag"
        className="sb-team-flag sb-team-flag-img"
        style={{
          width: '42px',
          height: '28px',
          objectFit: 'cover',
          border: '1px solid rgba(212, 168, 67, 0.25)',
          borderRadius: '4px',
          background: 'none',
          padding: 0
        }}
      />
    );
  }
  return <span className="sb-team-flag">{flag}</span>;
}

/* ─── SCOREBOARD MODULE ─── */
function ScoreboardModule({ content }) {
  return (
    <div className="module-scoreboard-display">
      <div className="sb-main">
        <div className="sb-team">
          <TeamFlag flag={content.teamA.flag} />
          <div className="sb-team-label">{content.teamA.name}</div>
          <div className="sb-team-code">{content.teamA.code}</div>
        </div>
        <div className="sb-score">{content.teamA.score}</div>
        <div className="sb-divider">-</div>
        <div className="sb-score">{content.teamB.score}</div>
        <div className="sb-team">
          <TeamFlag flag={content.teamB.flag} />
          <div className="sb-team-label">{content.teamB.name}</div>
          <div className="sb-team-code">{content.teamB.code}</div>
        </div>
      </div>
      {content.status && <div className="sb-status">{content.status}</div>}
    </div>
  );
}

/* ─── RESULTS MODULE ─── */
function ResultsModule({ content }) {
  return (
    <div className="module-results-display">
      <div className="results-title-display">{content.title}</div>
      <div className="results-list-container">
        {(content.matches || []).map((match, i) => (
          <div key={i} className="result-match-box">
            <div className="result-row-display">
              <span className="result-team-display">{match.teamA}</span>
              <span className="result-score-display">{match.scoreA}</span>
            </div>
            <div className="result-row-display">
              <span className="result-team-display">{match.teamB}</span>
              <span className="result-score-display">{match.scoreB}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── UPCOMING MODULE ─── */
function UpcomingModule({ content }) {
  return (
    <div className="module-upcoming-display">
      <div className="upcoming-header-box">
        <div className="upcoming-label-display">{content.label || 'SIGUIENTE PARTIDO'}</div>
        <div className="upcoming-time-display">{content.time}</div>
      </div>
      <div className="upcoming-vs-card">
        <div className="upcoming-team">{content.teamA}</div>
        <div className="upcoming-vs-badge">VS</div>
        <div className="upcoming-team">{content.teamB}</div>
      </div>
    </div>
  );
}

/* ─── NEWS MODULE ─── */
function NewsModule({ content }) {
  return (
    <div className="module-news-display">
      <div className="news-title-display">{content.title}</div>
      <div className="news-content-display">{content.content}</div>
    </div>
  );
}

/* ─── APUESTA MODULE ─── */
function ApuestaModule({ content }) {
  const mode = content.mode || '3-way';
  return (
    <div className="module-apuesta-display">
      <div className="apuesta-header">
        <div className="apuesta-title">{content.title}</div>
        <div className="apuesta-tag">{content.tag}</div>
      </div>
      <div className="apuesta-odds-row">
        {/* Box Left: Team A / Selection A (always rendered) */}
        {(mode === '1-way' || mode === '2-way' || mode === '3-way') && (
          <div className="apuesta-odd-box box-left">
            <span className="apuesta-odd-label">{mode === '1-way' ? 'OPCIÓN ÚNICA' : 'LOCAL'}</span>
            <div className="apuesta-team-info">
              <TeamFlag flag={content.teamA?.flag} />
              <span className="apuesta-team-name">{content.teamA?.name || 'Local'}</span>
            </div>
            <span className="apuesta-odd-value">{content.teamA?.odd || '—'}</span>
          </div>
        )}
        
        {/* Box Center: Draw (only in 3-way mode) */}
        {mode === '3-way' && (
          <div className="apuesta-odd-box box-center">
            <span className="apuesta-odd-label">EMPATE</span>
            <div className="apuesta-team-info" style={{ opacity: 0, pointerEvents: 'none' }}>
              <span style={{ display: 'inline-block', width: 'calc(28px * var(--scale, 1))', height: 'calc(18px * var(--scale, 1))' }} />
              <span className="apuesta-team-name">Empate</span>
            </div>
            <span className="apuesta-odd-value">{content.draw?.odd || '—'}</span>
          </div>
        )}
        
        {/* Box Right: Team B (in 3-way and 2-way modes) */}
        {(mode === '3-way' || mode === '2-way') && (
          <div className="apuesta-odd-box box-right">
            <span className="apuesta-odd-label">VISITANTE</span>
            <div className="apuesta-team-info">
              <TeamFlag flag={content.teamB?.flag} />
              <span className="apuesta-team-name">{content.teamB?.name || 'Visitante'}</span>
            </div>
            <span className="apuesta-odd-value">{content.teamB?.odd || '—'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PREGUNTA MODULE (SÍ/NO) ─── */
function PreguntaModule({ content }) {
  return (
    <div className="module-pregunta-display">
      <div className="pregunta-header">
        <div className="pregunta-title">{content.title}</div>
        {content.tag && <div className="pregunta-tag">{content.tag}</div>}
      </div>
      <div className="pregunta-options-row">
        <div className="pregunta-option-box box-yes">
          <span className="pregunta-option-label">SÍ</span>
          <span className="pregunta-option-value">{content.yesOdd || '—'}</span>
        </div>
        <div className="pregunta-option-box box-no">
          <span className="pregunta-option-label">NO</span>
          <span className="pregunta-option-value">{content.noOdd || '—'}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── TICKER MODULE ─── */
function TickerModule({ content }) {
  const allMessages = [...(content.messages || []), ...(content.messages || [])];
  return (
    <div className="module-ticker-display">
      {content.isLive && (
        <div className="ticker-live-badge">
          <span className="ticker-live-dot" />
          EN VIVO
        </div>
      )}
      <div className="ticker-content">
        <div className="ticker-scroll">
          {allMessages.map((msg, i) => (
            <span key={i}>
              <span className="ticker-text">{msg}</span>
              {i < allMessages.length - 1 && <span className="ticker-separator">|</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DISPLAY VIEW — BILLBOARD 1920×1080
   ═══════════════════════════════════════════ */
/* ─── DYNAMIC VERTICAL LAYOUT PACKER ─── */
export function getVerticalLayout(modules) {
  const brand = modules.find(m => m.id === 'default_brand' || (m.type === 'media' && m.label.toLowerCase().includes('logo')));
  const ticker = modules.find(m => m.type === 'ticker');
  
  // Clone and filter rest of the modules
  const rest = modules.filter(m => m !== brand && m !== ticker).map(m => ({ ...m }));
  
  const verticalModules = [];
  let currentRow = 1;

  // 1. Brand/Logo at the top
  if (brand) {
    verticalModules.push({
      ...brand,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 1 }
    });
    currentRow++;
  }

  // 2. Scoreboard
  const scoreboard = rest.find(m => m.type === 'scoreboard');
  if (scoreboard) {
    verticalModules.push({
      ...scoreboard,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 1 }
    });
    rest.splice(rest.indexOf(scoreboard), 1);
    currentRow++;
  }

  // 3. Hero Media (Stadium / Main Image)
  const hero = rest.find(m => m.id === 'default_hero' || (m.type === 'media' && !m.label.toLowerCase().includes('logo') && m.id !== 'default_featured'));
  if (hero) {
    verticalModules.push({
      ...hero,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 2 } // Hero is taller, spanning 2 rows
    });
    rest.splice(rest.indexOf(hero), 1);
    currentRow += 2;
  }

  // 4. Pack all other modules one by one (stacked vertically)
  while (rest.length > 0) {
    const next = rest.shift();
    // For media or featured modules, we make them span 2 rows to look good
    const isMedia = next.type === 'media' || next.id === 'default_featured';
    const rowSpan = isMedia ? 2 : 1;

    verticalModules.push({
      ...next,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan }
    });
    currentRow += rowSpan;
  }

  // 5. Ticker at the bottom
  if (ticker) {
    verticalModules.push({
      ...ticker,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 1 }
    });
  }

  return {
    modules: verticalModules,
    grid: { cols: 1, rows: ticker ? currentRow : (currentRow - 1) }
  };
}

export default function DisplayView() {
  const { rawLiveData, rawDraftData } = useCMS();
  const [searchParams] = useSearchParams();
  const [viewportRatio, setViewportRatio] = useState(window.innerWidth / window.innerHeight);
  const [isVertical, setIsVertical] = useState(window.innerWidth < window.innerHeight);

  useEffect(() => {
    function handleResize() {
      setIsVertical(window.innerWidth < window.innerHeight);
      setViewportRatio(window.innerWidth / window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect screen layout: manual query param has priority, then auto-detection by aspect ratio
  let screenType = searchParams.get('screen');
  if (!screenType) {
    // 9x9 has a 1:1 aspect ratio (1.0). 12x6 has a 2:1 aspect ratio (2.0).
    // If the viewport is close to square (ratio <= 1.35), use the 9x9 layout.
    // Otherwise, default to the 12x6 layout.
    screenType = viewportRatio <= 1.35 ? '9x9' : '12x6';
  }
  
  const isDraft = searchParams.get('draft') === 'true' || searchParams.get('mode') === 'draft';
  const targetData = isDraft ? rawDraftData : rawLiveData;

  // Extract modules and layouts from target data
  const modules = targetData?.modules || [];
  const layouts = targetData?.layouts || {};
  const activeLayoutObj = layouts[screenType] || layouts['12x6'] || { grid: { cols: 12, rows: 6 }, positions: {} };

  // Map modules to their corresponding positions in the selected layout
  const mappedModules = modules.map((mod) => ({
    ...mod,
    gridPosition: activeLayoutObj.positions?.[mod.id] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
  }));

  const visibleModules = mappedModules.filter(m => m.visible !== false);
  const layout = isVertical ? getVerticalLayout(visibleModules) : { modules: visibleModules, grid: activeLayoutObj.grid };

  return (
    <div
      className={`viewport-container ${isVertical ? 'vertical' : 'horizontal'}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        background: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className={`billboard-grid ${isVertical ? 'vertical' : 'horizontal'}`}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: isVertical ? 'none' : (screenType === '9x9' ? '100vh' : '200vh'),
          maxHeight: isVertical ? 'none' : (screenType === '9x9' ? '100vw' : '50vw'),
          aspectRatio: isVertical ? 'auto' : (screenType === '9x9' ? '1 / 1' : '2 / 1'),
          gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
          gridTemplateRows: isVertical
            ? Array.from({ length: layout.grid.rows }).map((_, i) => {
                const rowNum = i + 1;
                const mod = layout.modules.find(m => 
                  m.gridPosition.row <= rowNum && rowNum < m.gridPosition.row + m.gridPosition.rowSpan
                );
                if (!mod) return '1fr';
                if (mod.type === 'ticker') return '80px';
                const isBrand = mod.id === 'default_brand' || (mod.type === 'media' && mod.label?.toLowerCase().includes('logo'));
                if (isBrand) return '80px';
                
                let baseWeight = 1.5;
                if (mod.type === 'media') baseWeight = 2.5;
                else if (mod.type === 'scoreboard') baseWeight = 1.8;
                else if (mod.type === 'upcoming') baseWeight = 1.5;
                else if (mod.type === 'results') baseWeight = 1.8;
                else if (mod.type === 'news') baseWeight = 1.8;
                
                return `${baseWeight / mod.gridPosition.rowSpan}fr`;
              }).join(' ')
            : Array.from({ length: layout.grid.rows }).map((_, i) => 
                layout.modules.some(m => m.type === 'ticker' && m.gridPosition.row === i + 1) ? '80px' : '1fr'
              ).join(' '),
          display: 'grid',
          gap: '2px',
          background: 'var(--color-border)'
        }}
      >
        {layout.modules.map((mod) => {
          const indexInMaster = modules.findIndex((m) => m.id === mod.id);
          return (
            <div
              key={mod.id}
              className="module-cell"
              style={{
                gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
                gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
                zIndex: modules.length - indexInMaster
              }}
            >
              <RenderModule 
                module={mod} 
                gridPosition={mod.gridPosition} 
                gridCols={layout.grid.cols} 
                gridRows={layout.grid.rows} 
              />
            </div>
          );
        })}
      </div>

      <Link to="/admin" className="floating-admin-btn" title="Panel de Administración">
        <span>⚙️</span>
        <span className="floating-admin-text">Administrador</span>
      </Link>
    </div>
  );
}
