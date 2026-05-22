import { useEffect, useRef, useState } from 'react';
import { useCMS } from '../context/CMSContext';

/* ─── Render a single module based on its type ─── */
function RenderModule({ module }) {
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
  if (content.showBrandOverlay) {
    return (
      <div className="module-media">
        {content.src && (
          <>
            {isVideo(content.src, content.mediaType) ? (
              <video className="media-content" src={content.src} autoPlay muted loop playsInline />
            ) : (
              <img className={`media-content ${content.objectFit === 'contain' ? 'contain' : ''}`} src={content.src} alt={content.alt || ''} />
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
            <video className="media-content" src={content.src} autoPlay muted loop playsInline />
          ) : (
            <img className={`media-content ${content.objectFit === 'contain' ? 'contain' : ''}`} src={content.src} alt={content.alt || ''} />
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

  useEffect(() => {
    function handleResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / 1920, vh / 1080));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { modules, grid } = data;

  return (
    <div
      ref={containerRef}
      className="viewport-container"
      style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
    >
      <div
        className="billboard-grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: Array.from({ length: grid.rows }).map((_, i) => 
            modules.some(m => m.type === 'ticker' && m.gridPosition.row === i + 1) ? '80px' : '1fr'
          ).join(' '),
        }}
      >
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="module-cell"
            style={{
              gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
              gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
            }}
          >
            <RenderModule module={mod} />
          </div>
        ))}
      </div>
    </div>
  );
}
