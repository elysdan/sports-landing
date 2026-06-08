import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';

export function RenderModule({ module, gridPosition, gridCols = 12, gridRows = 6, isLivePreview = false, overrideWidth, screenType }) {
  const gp = gridPosition || module.gridPosition || { colSpan: 1, rowSpan: 1 };
  const colSpan = gp.colSpan || 1;
  const rowSpan = gp.rowSpan || 1;

  const colFraction = colSpan / gridCols;
  const rowFraction = rowSpan / gridRows;

  const isVerticalLayout = gridCols === 1 || (window.innerWidth < window.innerHeight);

  let gridAspect = 2.0;
  if (isVerticalLayout) {
    gridAspect = 0.5625;
  } else {
    const activeScreenType = screenType || (gridCols === gridRows ? '9x9' : '12x6');
    if (activeScreenType === '9x9') {
      gridAspect = 1.0;
    } else if (activeScreenType === '12x6') {
      gridAspect = 2.0;
    } else {
      gridAspect = gridCols / gridRows;
    }
  }
  const sizeFactor = Math.min(colFraction * gridAspect, rowFraction);

  const baseWidth = isVerticalLayout ? 1080 : 1920;
  const actualWidth = overrideWidth !== undefined
    ? overrideWidth
    : (isLivePreview ? baseWidth : window.innerWidth);
  const viewportScale = actualWidth / baseWidth;

  const baseScale = isVerticalLayout
    ? (0.45 + (rowFraction * 1.5))
    : (0.12 + (sizeFactor * 2.8) + (Math.min(colFraction, rowFraction * 1.8) * 0.6));

  const content = module.content || {};
  const scale = baseScale * viewportScale * (gp.scaleFactor !== undefined ? gp.scaleFactor : (content.scaleFactor !== undefined ? content.scaleFactor : 1.0));
  const layoutTextSizeFactor = gp.textSizeFactor !== undefined
    ? gp.textSizeFactor
    : (content.textSizeFactor !== undefined ? content.textSizeFactor : 1.0);

  const aspect = isVerticalLayout
    ? (9 / 16)
    : (screenType === '9x9' ? 1.0 : 2.0);
  const actualGridHeight = actualWidth / aspect;
  const cellHeight = (rowSpan / gridRows) * actualGridHeight;
  const isShort = rowSpan === 1 || cellHeight < 200;

  const bgType = content.moduleBgType || (content.moduleBgTransparent === true ? 'transparent' : 'color');
  const bgImage = content.moduleBgImage;
  const bgVideo = content.moduleBgVideo;
  const bgObjectFit = content.moduleBgObjectFit || 'cover';
  const bgOpacity = content.moduleBgOpacity !== undefined ? content.moduleBgOpacity : 1.0;

  const wrapperStyle = {
    '--scale': scale,
    '--text-scale-factor': layoutTextSizeFactor,
    '--card-bg-color': content.cardBgColor || (module.type === 'apuesta' ? '#161616' : 'rgba(255, 255, 255, 0.03)'),
    '--module-bg-color': (bgType === 'transparent' || bgType === 'image' || bgType === 'video') ? 'transparent' : (content.moduleBgColor || content.cardBgColor || (module.type === 'apuesta' ? '#4b4b4b' : '#0a0a0a')),
    '--module-border-color': content.moduleBorderTransparent === true ? 'transparent' : (content.moduleBorderColor || 'var(--color-border)'),
    '--apuesta-odd-scale': content.apuestaOddScale !== undefined ? content.apuestaOddScale : 1.0,
    ...(content.textColor ? { '--text-color': content.textColor } : {}),
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0
  };

  const isBgTransparent = bgType === 'transparent' || bgType === 'image' || bgType === 'video';
  const hasCustomBg = bgType === 'color' || (!content.moduleBgType && !!content.moduleBgColor);

  const wrapperClass = [
    'module-wrapper',
    `span-w-${colSpan}`,
    `span-h-${rowSpan}`,
    (colSpan <= 6) ? `narrow-col-${Math.min(4, colSpan)}` : '',
    rowSpan === 1 ? 'short-row-1' : '',
    layoutTextSizeFactor >= 1.4 ? 'large-text-layout' : '',
    isBgTransparent ? 'bg-transparent' : '',
    hasCustomBg ? 'has-custom-bg' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {/* Fondo de Imagen o Video */}
      {bgType === 'image' && bgImage && (
        <div className="module-bg-media-container" style={{ opacity: bgOpacity }}>
          <img src={bgImage} className="module-bg-media" style={{ objectFit: bgObjectFit }} alt="Module Background" />
        </div>
      )}
      {bgType === 'video' && bgVideo && (
        <div className="module-bg-media-container" style={{ opacity: bgOpacity }}>
          <video src={bgVideo} className="module-bg-media" style={{ objectFit: bgObjectFit }} autoPlay muted loop playsInline />
        </div>
      )}

      {/* Contenido del módulo con zIndex para asegurar que esté sobre el fondo */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, width: '100%', height: '100%', minHeight: 0, minWidth: 0 }}>
        {(() => {
          switch (module.type) {
            case 'media':
              return <MediaModule content={module.content} />;
            case 'scoreboard':
              return <ScoreboardModule content={module.content} />;
            case 'upcoming':
              return <UpcomingModule content={module.content} />;
            case 'apuesta':
              return <ApuestaModule content={module.content} isVerticalLayout={isVerticalLayout} isShort={isShort} />;
            case 'pregunta':
              return <PreguntaModule content={module.content} />;
            default:
              return <div className="module-media"><div className="media-placeholder"><div className="media-placeholder-icon">❓</div>Módulo desconocido</div></div>;
          }
        })()}
      </div>
    </div>
  );
}

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
          {content.overlayTitle && (
            <div className="media-text-title">{content.overlayTitle}</div>
          )}
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

export function emojiToCountryCode(emoji) {
  if (!emoji) return null;
  try {
    const codePoints = Array.from(emoji);
    if (codePoints.length >= 1) {
      const charCode = codePoints[0].codePointAt(0);
      if (charCode >= 127462 && charCode <= 127487) {
        let code = '';
        for (let i = 0; i < Math.min(2, codePoints.length); i++) {
          const cp = codePoints[i].codePointAt(0);
          if (cp >= 127462 && cp <= 127487) {
            code += String.fromCharCode(cp - 127462 + 65);
          }
        }
        if (code.length === 2) {
          return code.toLowerCase();
        }
      }
    }
  } catch (e) {
    console.error("Error parsing emoji flag:", e);
  }
  return null;
}

export function getTeamFlag(teamName, explicitFlag, parsedFlag, worldCupTeams = []) {
  if (explicitFlag) return explicitFlag;
  if (parsedFlag) return parsedFlag;
  if (!teamName) return null;
  const found = worldCupTeams.find(t => t.name.toUpperCase() === teamName.trim().toUpperCase());
  return found ? found : null;
}

export function TeamFlag({ flag, teamName, worldCupTeams = [] }) {
  if (!flag && !teamName) return null;

  let flagUrl = null;

  const targetName = teamName || (typeof flag === 'string' && flag.length > 4 ? flag : null);
  if (targetName && Array.isArray(worldCupTeams) && worldCupTeams.length > 0) {
    const found = worldCupTeams.find(
      t => t.name.toUpperCase() === targetName.trim().toUpperCase() ||
        (flag && flag !== '?' && flag !== '??' && t.flag === flag)
    );
    if (found && found.id) {
      flagUrl = `/paises/${found.id}.svg`;
    }
  }

  if (!flagUrl && flag && !isNaN(flag)) {
    flagUrl = `/paises/${flag}.svg`;
  }

  if (!flagUrl && typeof flag === 'string') {
    const isUrl = flag.startsWith('/') || flag.startsWith('http') || flag.includes('.') || flag.startsWith('data:image');
    if (isUrl) {
      flagUrl = flag;
    } else {
      const countryCode = emojiToCountryCode(flag);
      if (countryCode) {
        flagUrl = `https://flagcdn.com/w160/${countryCode}.png`;
      }
    }
  }

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={teamName || "Flag"}
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
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return <span className="sb-team-flag">{flag || '🏳️'}</span>;
}

function ScoreboardModule({ content }) {
  const { worldCupTeams = [] } = useCMS();
  return (
    <div className="module-scoreboard-display">
      <div className="sb-cards-container">
        <div className="sb-team-card">
          <div className="sb-card-score">{content.teamA.score}</div>
          <div className="sb-card-info">
            <TeamFlag flag={content.teamA.flag} teamName={content.teamA.name} worldCupTeams={worldCupTeams} />
            <span className="sb-card-code">{content.teamA.code || content.teamA.name?.slice(0, 3)}</span>
          </div>
        </div>

        <div className="sb-card-divider">-</div>

        <div className="sb-team-card">
          <div className="sb-card-score">{content.teamB.score}</div>
          <div className="sb-card-info">
            <TeamFlag flag={content.teamB.flag} teamName={content.teamB.name} worldCupTeams={worldCupTeams} />
            <span className="sb-card-code">{content.teamB.code || content.teamB.name?.slice(0, 3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function parseTeamString(teamStr) {
  if (!teamStr) return { flag: null, name: '' };
  const trimmed = teamStr.trim();
  const emojiRegex = /^([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]|\p{Emoji_Presentation}|\p{Emoji})/u;
  const match = trimmed.match(emojiRegex);
  if (match) {
    const flag = match[0];
    const name = trimmed.slice(flag.length).trim();
    return { flag, name };
  }
  return { flag: null, name: trimmed };
}

function UpcomingModule({ content }) {
  const { worldCupTeams = [] } = useCMS();
  const teamAInfo = parseTeamString(content.teamA);
  const teamBInfo = parseTeamString(content.teamB);

  const flagA = getTeamFlag(teamAInfo.name, content.flagA, teamAInfo.flag, worldCupTeams);
  const flagB = getTeamFlag(teamBInfo.name, content.flagB, teamBInfo.flag, worldCupTeams);

  return (
    <div className="module-upcoming-display">
      <div className="upcoming-header-box">
        <div className="upcoming-time-display">{content.time}</div>
      </div>
      <div className={`upcoming-vs-card ${content.showVS === false ? 'no-vs' : ''}`}>
        <div className="upcoming-team-box box-left">
          <TeamFlag flag={flagA?.flag || flagA || '🏳️'} teamName={teamAInfo.name} worldCupTeams={worldCupTeams} />
          <span className="upcoming-number">{content.numA || ''}</span>
        </div>
        {content.showVS !== false && <div className="upcoming-vs-badge">VS</div>}
        <div className="upcoming-team-box box-right">
          <span className="upcoming-number">{content.numB || ''}</span>
          <TeamFlag flag={flagB?.flag || flagB || '🏳️'} teamName={teamBInfo.name} worldCupTeams={worldCupTeams} />
        </div>
      </div>
    </div>
  );
}

function ApuestaModule({ content, isVerticalLayout, isShort }) {
  const mode = content.mode || '3-way';
  const teamAInfo = content.teamA || {};
  const teamBInfo = content.teamB || {};
  const hasTeamA = !!(teamAInfo.name?.trim() || teamAInfo.code?.trim());
  const hasTeamB = !!(teamBInfo.name?.trim() || teamBInfo.code?.trim());

  return (
    <div className={`module-apuesta-display ${isVerticalLayout ? 'vertical' : 'horizontal'} ${isShort ? 'short-row' : ''}`}>
      <div className="apuesta-header">
        <div className="apuesta-title">{content.title}</div>
        {content.tag && <div className="apuesta-tag">{content.tag}</div>}
      </div>
      <div className="apuesta-odds-row">
        {(mode === '1-way' || mode === '2-way' || mode === '3-way') && (
          <div className={`apuesta-odd-box box-left ${!hasTeamA ? 'no-team-info' : ''}`}>
            {hasTeamA && (
              <div className="apuesta-team-info">
                <span className="apuesta-team-name">{teamAInfo.code || teamAInfo.name || ''}</span>
              </div>
            )}
            <span className="apuesta-odd-value">{teamAInfo.odd || '—'}</span>
          </div>
        )}

        {mode === '3-way' && (
          <div className="apuesta-odd-box box-center">
            <span className="apuesta-odd-value">{content.draw?.odd || '—'}</span>
          </div>
        )}

        {(mode === '3-way' || mode === '2-way') && (
          <div className={`apuesta-odd-box box-right ${!hasTeamB ? 'no-team-info' : ''}`}>
            <span className="apuesta-odd-value">{teamBInfo.odd || '—'}</span>
            {hasTeamB && (
              <div className="apuesta-team-info">
                <span className="apuesta-team-name">{teamBInfo.code || teamBInfo.name || ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PreguntaModule({ content }) {
  const yesType = content.yesType || 'text';
  const noType = content.noType || 'text';
  const optionLayoutClass = content.optionLayout === 'horizontal' ? 'layout-horizontal' : 'layout-vertical';

  const moduleStyle = {
    '--pregunta-title-size': content.titleFontSize || 1.0,
    '--pregunta-option-scale': content.optionScaleFactor || 1.0,
  };
  if (content.titleTextColor) {
    moduleStyle['--pregunta-title-color'] = content.titleTextColor;
  }
  if (content.titleBgColor) {
    moduleStyle['--pregunta-title-bg'] = content.titleBgColor;
  }

  return (
    <div className="module-pregunta-display" style={moduleStyle}>
      <div className="pregunta-header" style={content.titleBgColor ? { backgroundColor: 'var(--pregunta-title-bg)' } : {}}>
        <div className="pregunta-title" style={content.titleTextColor ? { color: 'var(--pregunta-title-color)' } : {}}>{content.title}</div>
      </div>
      <div className="pregunta-divider-horizontal" />
      <div className="pregunta-options-row">
        <div className={`pregunta-option-box box-yes ${optionLayoutClass}`}>
          {yesType === 'sticker' ? (
            <img
              src={`/${content.yesSticker || 'sticker1.png'}`}
              alt="Sticker"
              className="pregunta-option-sticker"
            />
          ) : (
            <span className="pregunta-option-label">
              {content.yesText !== undefined ? content.yesText : 'SI'}
            </span>
          )}
          <span className="pregunta-option-value" style={{ '--char-count': (content.yesOdd || '—').length }}>
            {content.yesOdd || '—'}
          </span>
        </div>
        <div className="pregunta-divider-vertical" />
        <div className={`pregunta-option-box box-no ${optionLayoutClass}`}>
          {noType === 'sticker' ? (
            <img
              src={`/${content.noSticker || 'sticker1.png'}`}
              alt="Sticker"
              className="pregunta-option-sticker"
            />
          ) : (
            <span className="pregunta-option-label">
              {content.noText !== undefined ? content.noText : 'NO'}
            </span>
          )}
          <span className="pregunta-option-value" style={{ '--char-count': (content.noOdd || '—').length }}>
            {content.noOdd || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* DISPLAY VIEW — BILLBOARD 1920×1080 */
/* ─── DYNAMIC VERTICAL LAYOUT PACKER ─── */
export function getVerticalLayout(modules) {
  const brand = modules.find(m => m.id === 'default_brand' || (m.type === 'media' && m.label?.toLowerCase().includes('logo')));

  const rest = modules.filter(m => m !== brand).map(m => ({ ...m }));

  const verticalModules = [];
  let currentRow = 1;

  if (brand) {
    verticalModules.push({
      ...brand,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 1 }
    });
    currentRow++;
  }

  const scoreboard = rest.find(m => m.type === 'scoreboard');
  if (scoreboard) {
    verticalModules.push({
      ...scoreboard,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 1 }
    });
    rest.splice(rest.indexOf(scoreboard), 1);
    currentRow++;
  }

  const hero = rest.find(m => m.id === 'default_hero' || (m.type === 'media' && !m.label?.toLowerCase().includes('logo') && m.id !== 'default_featured'));
  if (hero) {
    verticalModules.push({
      ...hero,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan: 2 }
    });
    rest.splice(rest.indexOf(hero), 1);
    currentRow += 2;
  }

  while (rest.length > 0) {
    const next = rest.shift();
    const isMedia = next.type === 'media' || next.id === 'default_featured';
    const rowSpan = isMedia ? 2 : 1;

    verticalModules.push({
      ...next,
      gridPosition: { col: 1, row: currentRow, colSpan: 1, rowSpan }
    });
    currentRow += rowSpan;
  }

  return {
    modules: verticalModules,
    grid: { cols: 1, rows: currentRow - 1 }
  };
}

export default function DisplayView() {
  const { rawLiveData, rawDraftData, hasLoadedFromServer } = useCMS();
  const [searchParams] = useSearchParams();
  const [viewportRatio, setViewportRatio] = useState(window.innerWidth / window.innerHeight);
  const [isVertical, setIsVertical] = useState(window.innerWidth < window.innerHeight);

  const [showCurtain, setShowCurtain] = useState(true);
  const [fadeCurtain, setFadeCurtain] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsVertical(window.innerWidth < window.innerHeight);
      setViewportRatio(window.innerWidth / window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (hasLoadedFromServer) {
      const fadeTimer = setTimeout(() => {
        setFadeCurtain(true);
      }, 300);

      const removeTimer = setTimeout(() => {
        setShowCurtain(false);
      }, 800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [hasLoadedFromServer]);

  let screenType = searchParams.get('screen');
  if (!screenType) {
    screenType = viewportRatio <= 1.35 ? '9x9' : '12x6';
  }

  const isDraft = searchParams.get('draft') === 'true' || searchParams.get('mode') === 'draft';
  const targetData = isDraft ? rawDraftData : rawLiveData;

  const modules = targetData?.modules || [];
  const layouts = targetData?.layouts || {};
  const activeLayoutObj = layouts[screenType] || layouts['12x6'] || { grid: { cols: 12, rows: 6 }, positions: {} };

  const mappedModules = modules.map((mod) => ({
    ...mod,
    gridPosition: activeLayoutObj.positions?.[mod.id] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
  }));

  const visibleModules = mappedModules.filter(m => m.visible !== false);
  const layout = isVertical ? getVerticalLayout(visibleModules) : { modules: visibleModules, grid: activeLayoutObj.grid };

  const aspect = isVertical
    ? (9 / 16)
    : (screenType === '9x9' ? 1.0 : 2.0);

  const targetWidth = isVertical ? 1080 : 1920;
  const targetHeight = targetWidth / aspect;

  const scaleFit = Math.min(window.innerWidth / targetWidth, window.innerHeight / targetHeight);

  if (!hasLoadedFromServer && !targetData?.modules) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #111111 0%, #1c1810 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          color: 'var(--color-gold)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="/logo_GANA_Y_SIN.webp" alt="miCasino.com" fetchPriority="high" style={{ width: '500px', maxWidth: '85%', height: 'auto', filter: 'drop-shadow(0 0 20px rgba(212, 168, 67, 0.45))' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`viewport-container ${isVertical ? 'vertical' : 'horizontal'}`}
      style={{
        width: '100vw',
        height: '100vh',
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
        className={`billboard-grid ${isVertical ? 'vertical' : 'horizontal'} screen-${screenType}`}
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          transform: `scale(${scaleFit})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
          gridTemplateRows: isVertical
            ? Array.from({ length: layout.grid.rows }).map((_, i) => {
              const rowNum = i + 1;
              const mod = layout.modules.find(m =>
                m.gridPosition.row <= rowNum && rowNum < m.gridPosition.row + m.gridPosition.rowSpan
              );
              if (!mod) return '1fr';
              const isBrand = mod.id === 'default_brand' || (mod.type === 'media' && mod.label?.toLowerCase().includes('logo'));
              if (isBrand) return '80px';

              let baseWeight = 1.5;
              if (mod.type === 'media') baseWeight = 2.5;
              else if (mod.type === 'scoreboard') baseWeight = 1.8;
              else if (mod.type === 'upcoming') baseWeight = 1.5;
              else if (mod.type === 'pregunta') baseWeight = 1.8;
              else if (mod.type === 'apuesta') baseWeight = 1.8;

              return `${baseWeight / mod.gridPosition.rowSpan}fr`;
            }).join(' ')
            : `repeat(${layout.grid.rows}, 1fr)`,
          display: 'grid',
          gap: '2px',
          background: 'var(--color-border)'
        }}
      >
        {layout.modules.map((mod) => {
          const indexInMaster = modules.findIndex((m) => m.id === mod.id);
          const spansAll = mod.gridPosition.colSpan === layout.grid.cols &&
            mod.gridPosition.rowSpan === layout.grid.rows;
          return (
            <div
              key={mod.id}
              className={`module-cell ${spansAll ? 'spans-all-grid' : ''}`}
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
                overrideWidth={targetWidth}
                screenType={screenType}
              />
            </div>
          );
        })}
      </div>

      {/* Telón animado de carga para una transición premium sin pantallas negras */}
      {showCurtain && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #111111 0%, #1c1810 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-gold)',
            opacity: fadeCurtain ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src="/logo_GANA_Y_SIN.webp" alt="miCasino.com" fetchPriority="high" style={{ width: '500px', maxWidth: '85%', height: 'auto', filter: 'drop-shadow(0 0 20px rgba(212, 168, 67, 0.45))' }} />
          </div>
        </div>
      )}
    </div>
  );
}
