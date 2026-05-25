import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';

/* ─── Render a single module based on its type ─── */
export function RenderModule({ module }) {
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
    default:
      return <div className="module-media"><div className="media-placeholder"><div className="media-placeholder-icon">❓</div>Módulo desconocido</div></div>;
  }
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

/* ─── SCOREBOARD MODULE ─── */
function ScoreboardModule({ content }) {
  return (
    <div className="module-scoreboard-display">
      <div className="sb-main">
        <div className="sb-team">
          <span className="sb-team-flag">{content.teamA.flag}</span>
          <div className="sb-team-label">{content.teamA.name}</div>
          <div className="sb-team-code">{content.teamA.code}</div>
        </div>
        <div className="sb-score">{content.teamA.score}</div>
        <div className="sb-divider">-</div>
        <div className="sb-score">{content.teamB.score}</div>
        <div className="sb-team">
          <span className="sb-team-flag">{content.teamB.flag}</span>
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
      {(content.matches || []).map((match, i) => (
        <div key={i}>
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
  const { liveData } = useCMS();
  const [isVertical, setIsVertical] = useState(window.innerWidth < window.innerHeight);

  useEffect(() => {
    function handleResize() {
      setIsVertical(window.innerWidth < window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { modules, grid } = liveData;
  const visibleModules = modules.filter(m => m.visible !== false);
  const layout = isVertical ? getVerticalLayout(visibleModules) : { modules: visibleModules, grid };

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
        background: 'var(--color-bg-primary)'
      }}
    >
      <div
        className={`billboard-grid ${isVertical ? 'vertical' : 'horizontal'}`}
        style={{
          width: '100%',
          height: '100%',
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
              <RenderModule module={mod} />
            </div>
          );
        })}
      </div>
      <Link to="/admin" className="floating-admin-btn" title="Panel de Administración">
        <span>⚙️</span>
        <span className="floating-admin-text">Administrar</span>
      </Link>
    </div>
  );
}
