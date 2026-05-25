import { useEffect, useRef, useState } from 'react';
import { useCMS } from '../context/CMSContext';
import { Link } from 'react-router-dom';

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
export default function DisplayView() {
  const { data } = useCMS();
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [screenConfig, setScreenConfig] = useState({ width: 1920, height: 1080, label: 'horizontal' });

  useEffect(() => {
    // Obtener tipo de pantalla de la URL una sola vez al montar
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');

    function handleResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      let config = { width: 1920, height: 1080, label: 'horizontal' };

      if (screenParam === '12x6' || screenParam === '2:1') {
        config = { width: 1536, height: 768, label: 'screen-12x6' };
      } else if (screenParam === '9x9' || screenParam === '1:1') {
        config = { width: 1152, height: 1152, label: 'screen-9x9' };
      } else if (screenParam === 'vertical') {
        config = { width: 1080, height: 1920, label: 'vertical' };
      } else if (screenParam === 'horizontal') {
        config = { width: 1920, height: 1080, label: 'horizontal' };
      } else {
        // Autodetección si no hay parámetro
        const ratio = vw / vh;
        if (ratio >= 1.8 && ratio <= 2.2) {
          config = { width: 1536, height: 768, label: 'screen-12x6' };
        } else if (ratio >= 0.9 && ratio <= 1.1) {
          config = { width: 1152, height: 1152, label: 'screen-9x9' };
        } else if (vw < vh) {
          config = { width: 1080, height: 1920, label: 'vertical' };
        } else {
          config = { width: 1920, height: 1080, label: 'horizontal' };
        }
      }

      setScreenConfig(config);
      setScale(Math.min(vw / config.width, vh / config.height));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { modules, grid } = data;
  const visibleModules = modules.filter(m => m.visible !== false);

  return (
    <>
      <div
        ref={containerRef}
        className={`viewport-container ${screenConfig.label}`}
        style={{
          width: `${screenConfig.width}px`,
          height: `${screenConfig.height}px`,
          transform: `translate(-50%, -50%) scale(${scale})`
        }}
      >
        <div
          className={`billboard-grid ${screenConfig.label}`}
          style={{
            width: `${screenConfig.width}px`,
            height: `${screenConfig.height}px`,
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: Array.from({ length: grid.rows }).map((_, i) => 
              visibleModules.some(m => m.type === 'ticker' && m.gridPosition.row === i + 1) ? '80px' : '1fr'
            ).join(' '),
          }}
        >
          {visibleModules.map((mod) => {
            const indexInMaster = data.modules.findIndex((m) => m.id === mod.id);
            return (
              <div
                key={mod.id}
                className="module-cell"
                style={{
                  gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
                  gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
                  zIndex: data.modules.length - indexInMaster,
                }}
              >
                <RenderModule module={mod} />
              </div>
            );
          })}
        </div>
      </div>

      <Link to="/admin" className="floating-admin-btn" title="Panel de Administración">
        <span>⚙️</span>
        <span className="floating-admin-text">Administrador</span>
      </Link>
    </>
  );
}
