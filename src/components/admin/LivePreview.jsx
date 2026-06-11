import { useRef, useState, useEffect } from 'react';
import { RenderModule, getVerticalLayout } from '../../views/DisplayView';

export default function LivePreview({ modules, grid, screenType }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  let canvasWidth = 1920;
  let canvasHeight = 1080;
  let labelClass = 'horizontal';

  if (screenType === 'vertical') {
    canvasWidth = 1080;
    canvasHeight = 1920;
    labelClass = 'vertical';
  } else if (screenType === '12x6') {
    canvasWidth = 1536;
    canvasHeight = 768;
    labelClass = 'screen-12x6';
  } else if (screenType === '9x9') {
    canvasWidth = 1152;
    canvasHeight = 1152;
    labelClass = 'screen-9x9';
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / canvasWidth;
        const scaleY = height / canvasHeight;
        setScale(Math.min(scaleX, scaleY));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  const visibleModules = modules.filter((m) => m.visible !== false);
  const isVerticalPreview = screenType === 'vertical';
  const layout = isVerticalPreview ? getVerticalLayout(visibleModules) : { modules: visibleModules, grid };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6)'
      }}
    >
      <div
        className={`billboard-grid ${labelClass}`}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
          gridTemplateRows: isVerticalPreview
            ? Array.from({ length: layout.grid.rows }).map((_, i) => {
              const rowNum = i + 1;
              const mod = layout.modules.find(m => {
                const r = m.gridPosition?.row || 1;
                const rs = m.gridPosition?.rowSpan || 1;
                return r <= rowNum && rowNum < r + rs;
              });
              if (!mod) return '1fr';
              const isBrand = mod.id === 'default_brand' || (mod.type === 'media' && mod.label?.toLowerCase().includes('logo'));
              if (isBrand) return '80px';

              let baseWeight = 1.5;
              if (mod.type === 'media') baseWeight = 2.5;
              else if (mod.type === 'scoreboard') baseWeight = 1.8;
              else if (mod.type === 'upcoming') baseWeight = 1.5;

              return `${baseWeight / (mod.gridPosition?.rowSpan || 1)}fr`;
            }).join(' ')
            : `repeat(${layout.grid.rows}, 1fr)`,
          background: 'var(--color-border)',
          gap: '2px',
          display: 'grid',
          position: 'absolute',
          flexShrink: 0,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {layout.modules.map((mod) => {
          const indexInMaster = modules.findIndex((m) => m.id === mod.id);
          return (
            <div
              key={mod.id}
              className="module-cell"
              style={{
                gridColumn: `${mod.gridPosition?.col || 1} / span ${mod.gridPosition?.colSpan || 1}`,
                gridRow: `${mod.gridPosition?.row || 1} / span ${mod.gridPosition?.rowSpan || 1}`,
                zIndex: modules.length - indexInMaster
              }}
            >
              <RenderModule
                module={mod}
                gridPosition={mod.gridPosition || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }}
                gridCols={layout.grid.cols}
                gridRows={layout.grid.rows}
                isLivePreview={true}
                overrideWidth={isVerticalPreview ? 1080 : canvasWidth}
                screenType={screenType}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
