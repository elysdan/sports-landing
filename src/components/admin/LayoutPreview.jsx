import { useState, useEffect, useRef, useMemo } from 'react';
import { useCMS, MODULE_TYPES } from '../../context/CMSContext';
import LivePreview from './LivePreview';

function isVideo(src, mediaType) {
  if (mediaType === 'video') return true;
  if (!src) return false;
  return src.match(/\.(mp4|webm|ogg)(\?|$)/i) || src.startsWith('data:video');
}

export default function LayoutPreview({ modules, grid, selectedId, onSelect, updateModule, removeModule, hasPermission }) {
  const { liveData, currentUser, hasPendingChanges, activeLayout } = useCMS();
  const [dragState, setDragState] = useState(null);
  const gridRef = useRef(null);
  const [activeTab, setActiveTab] = useState('blueprint'); // 'blueprint' or 'live'
  const [previewType, setPreviewType] = useState('12x6'); // Default to 12x6
  const [liveViewMode, setLiveViewMode] = useState('draft'); // 'live' or 'draft'
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('layout_preview_minimized') === 'true';
  });

  const toggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      localStorage.setItem('layout_preview_minimized', String(next));
      return next;
    });
  };

  // Update preview type aspect ratio when active layout shifts
  useEffect(() => {
    if (activeLayout === '12x6') {
      setPreviewType('12x6');
    } else if (activeLayout === '9x9') {
      setPreviewType('9x9');
    }
  }, [activeLayout]);

  const targetModules = liveViewMode === 'live' ? (liveData?.modules || []) : modules;
  const targetGrid = liveViewMode === 'live' ? (liveData?.grid || { cols: 5, rows: 5 }) : grid;

  // Generar celdas de cuadrícula de fondo estilo blueprint (optimizado con useMemo)
  const bgCells = useMemo(() => {
    const cells = [];
    for (let r = 1; r <= targetGrid.rows; r++) {
      for (let c = 1; c <= targetGrid.cols; c++) {
        cells.push(
          <div
            key={`bg-${r}-${c}`}
            className="layout-preview-bg-cell"
            style={{
              gridColumn: c,
              gridRow: r,
            }}
          />
        );
      }
    }
    return cells;
  }, [targetGrid.rows, targetGrid.cols]);

  // Iniciar Arrastre para Mover (Mouse)
  const handleMoveMouseDown = (e, mod) => {
    if (hasPermission && !hasPermission(mod.type)) return;
    if (e.target.closest('.layout-preview-cell-btn')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onSelect(mod.id);

    const gridEl = gridRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    const cellWidth = rect.width / grid.cols;
    const cellHeight = rect.height / grid.rows;

    const cellLeft = rect.left + (mod.gridPosition.col - 1) * cellWidth;
    const cellTop = rect.top + (mod.gridPosition.row - 1) * cellHeight;

    setDragState({
      type: 'move',
      moduleId: mod.id,
      offsetX: e.clientX - cellLeft,
      offsetY: e.clientY - cellTop,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
      startGridLeft: rect.left,
      startGridTop: rect.top,
    });
  };

  // Iniciar Arrastre para Mover (Touch)
  const handleMoveTouchStart = (e, mod) => {
    if (hasPermission && !hasPermission(mod.type)) return;
    if (e.target.closest('.layout-preview-cell-btn')) {
      return;
    }
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    onSelect(mod.id);

    const gridEl = gridRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    const cellWidth = rect.width / grid.cols;
    const cellHeight = rect.height / grid.rows;

    const cellLeft = rect.left + (mod.gridPosition.col - 1) * cellWidth;
    const cellTop = rect.top + (mod.gridPosition.row - 1) * cellHeight;

    const touch = e.touches[0];
    setDragState({
      type: 'move',
      moduleId: mod.id,
      offsetX: touch.clientX - cellLeft,
      offsetY: touch.clientY - cellTop,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
      startGridLeft: rect.left,
      startGridTop: rect.top,
    });
  };

  // Iniciar Redimensionamiento (Mouse)
  const handleResizeMouseDown = (e, mod, direction) => {
    if (hasPermission && !hasPermission(mod.type)) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(mod.id);

    const gridEl = gridRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();

    setDragState({
      type: 'resize',
      direction,
      moduleId: mod.id,
      startCol: mod.gridPosition.col,
      startRow: mod.gridPosition.row,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
      startGridLeft: rect.left,
      startGridTop: rect.top,
    });
  };

  // Iniciar Redimensionamiento (Touch)
  const handleResizeTouchStart = (e, mod, direction) => {
    if (hasPermission && !hasPermission(mod.type)) return;
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    onSelect(mod.id);

    const gridEl = gridRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();

    const touch = e.touches[0];
    setDragState({
      type: 'resize',
      direction,
      moduleId: mod.id,
      startCol: mod.gridPosition.col,
      startRow: mod.gridPosition.row,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
      startGridLeft: rect.left,
      startGridTop: rect.top,
    });
  };

  // Controlar eventos del ratón y touch globales durante el arrastre
  useEffect(() => {
    if (!dragState) return;

    const handleDragMove = (clientX, clientY) => {
      const gridEl = gridRef.current;
      if (!gridEl) return;
      const rect = gridEl.getBoundingClientRect();
      const cellWidth = rect.width / grid.cols;
      const cellHeight = rect.height / grid.rows;

      const mod = modules.find((m) => m.id === dragState.moduleId);
      if (!mod) return;

      if (dragState.type === 'move') {
        const gridShiftX = rect.left - dragState.startGridLeft;
        const gridShiftY = rect.top - dragState.startGridTop;

        const mouseXInGrid = clientX - rect.left;
        const mouseYInGrid = clientY - rect.top;

        const xInGrid = mouseXInGrid - dragState.offsetX + gridShiftX;
        const yInGrid = mouseYInGrid - dragState.offsetY + gridShiftY;

        let newCol = Math.round(xInGrid / cellWidth) + 1;
        let newRow = Math.round(yInGrid / cellHeight) + 1;

        // Limitar dentro del grid
        newCol = Math.max(1, Math.min(grid.cols - dragState.startColSpan + 1, newCol));
        newRow = Math.max(1, Math.min(grid.rows - dragState.startRowSpan + 1, newRow));

        if (newCol !== mod.gridPosition.col || newRow !== mod.gridPosition.row) {
          updateModule(dragState.moduleId, {
            gridPosition: {
              ...mod.gridPosition,
              col: newCol,
              row: newRow,
            },
          });
        }
      } else if (dragState.type === 'resize') {
        const cursorLineX = Math.round((clientX - dragState.startGridLeft) / cellWidth) + 1;
        const cursorLineY = Math.round((clientY - dragState.startGridTop) / cellHeight) + 1;

        let newCol = mod.gridPosition.col;
        let newRow = mod.gridPosition.row;
        let newColSpan = mod.gridPosition.colSpan;
        let newRowSpan = mod.gridPosition.rowSpan;

        const dir = dragState.direction;

        // Cambios en columnas (E / W / NW / NE / SW / SE)
        if (dir.includes('w')) {
          const maxColRight = dragState.startCol + dragState.startColSpan;
          newCol = Math.max(1, Math.min(maxColRight - 1, cursorLineX));
          newColSpan = maxColRight - newCol;
        } else if (dir.includes('e')) {
          newCol = dragState.startCol;
          newColSpan = cursorLineX - dragState.startCol;
          newColSpan = Math.max(1, Math.min(grid.cols - dragState.startCol + 1, newColSpan));
        }

        // Cambios en filas (N / S / NW / NE / SW / SE)
        if (dir.includes('n')) {
          const maxRowBottom = dragState.startRow + dragState.startRowSpan;
          newRow = Math.max(1, Math.min(maxRowBottom - 1, cursorLineY));
          newRowSpan = maxRowBottom - newRow;
        } else if (dir.includes('s')) {
          newRow = dragState.startRow;
          newRowSpan = cursorLineY - dragState.startRow;
          newRowSpan = Math.max(1, Math.min(grid.rows - dragState.startRow + 1, newRowSpan));
        }

        if (
          newCol !== mod.gridPosition.col ||
          newRow !== mod.gridPosition.row ||
          newColSpan !== mod.gridPosition.colSpan ||
          newRowSpan !== mod.gridPosition.rowSpan
        ) {
          updateModule(dragState.moduleId, {
            gridPosition: {
              col: newCol,
              row: newRow,
              colSpan: newColSpan,
              rowSpan: newRowSpan,
            },
          });
        }
      }
    };

    const handleMouseMove = (e) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleDragEnd = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [dragState, grid.cols, grid.rows, modules, updateModule]);

  return (
    <div
      className="layout-preview-container"
      style={{
        height: isMinimized ? '54px' : '420px',
        marginBottom: isMinimized ? '12px' : 'var(--gap-md)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      <div className="layout-preview-header" style={{ borderBottom: isMinimized ? 'none' : '1px solid var(--color-border)', paddingBottom: isMinimized ? 0 : '12px' }}>
        <div className="layout-preview-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          Diseño y Vista Previa (Blueprint)
          <button
            type="button"
            onClick={toggleMinimize}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-white)',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontWeight: 'bold',
              transition: 'background 0.2s, color 0.2s',
              userSelect: 'none'
            }}
            title={isMinimized ? "Maximizar sección de diseño" : "Minimizar sección de diseño"}
          >
            {isMinimized ? '↕️ Mostrar Diseño (Maximizar)' : '↕️ Ocultar Diseño (Minimizar)'}
          </button>
        </div>

        {/* Selector de Pantalla en Vivo para la previsualización */}
        {!isMinimized && (
          <div className="layout-preview-screen-select" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', marginRight: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Proporción:</span>
            <span
              style={{
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-body)',
                userSelect: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {activeLayout === '12x6' ? '📐 Pantalla 12x6 Mts (2:1)' : '⬛ Pantalla 9x9 Mts (1:1)'}
            </span>
          </div>
        )}

        {/* Tab Selector for mobile */}
        {!isMinimized && (
          <div className="layout-preview-tabs">
            <button
              type="button"
              className={`layout-preview-tab-btn ${activeTab === 'blueprint' ? 'active' : ''}`}
              onClick={() => setActiveTab('blueprint')}
            >
              📐 Recuadros
            </button>
            <button
              type="button"
              className={`layout-preview-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              👁️ En Vivo
            </button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <div className="layout-preview-panels">
          {/* Panel Izquierdo: Recuadros Editor */}
          <div className={`layout-preview-panel center-blueprint ${activeTab === 'blueprint' ? 'mobile-active' : 'mobile-hidden'}`}>
            <div className="panel-header">
              <span className="panel-icon">📐</span> Editor de Recuadros (Grid {targetGrid.cols}x{targetGrid.rows})
            </div>
            <div className="panel-content">
              <div
                ref={gridRef}
                className="layout-preview-grid"
                style={{
                  gridTemplateColumns: `repeat(${targetGrid.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${targetGrid.rows}, 1fr)`,
                  aspectRatio:
                    previewType === 'horizontal' ? '16/9' :
                      previewType === 'vertical' ? '9/16' :
                        previewType === '12x6' ? '2/1' : '1/1'
                }}
              >
                {/* Cuadrícula de diseño blueprint de fondo */}
                {bgCells}

                {/* Celdas interactivas de módulos */}
                {targetModules.map((mod) => {
                  const isSelected = selectedId === mod.id;
                  const isHidden = mod.visible === false;
                  const canEdit = (liveViewMode === 'draft') && (!hasPermission || hasPermission(mod.type));
                  const indexInMaster = targetModules.findIndex((m) => m.id === mod.id);

                  const isBgTransparent = mod.content?.moduleBgType === 'transparent' || mod.content?.moduleBgType === 'image' || mod.content?.moduleBgType === 'video' || mod.content?.moduleBgTransparent === true;
                  const cellBg = isSelected
                    ? 'rgba(212, 168, 67, 0.12)'
                    : (isBgTransparent ? 'rgba(22,22,22,0.85)' : (mod.content?.moduleBgColor || mod.content?.cardBgColor || '#0a0a0a'));

                  const cellBorder = isSelected
                    ? 'var(--color-gold)'
                    : (mod.content?.moduleBorderTransparent === true ? 'transparent' : (mod.content?.moduleBorderColor || 'var(--color-border)'));

                  return (
                    <div
                      key={mod.id}
                      className={`layout-preview-cell ${isSelected ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                      style={{
                        gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
                        gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
                        zIndex: isSelected ? 100 : (targetModules.length - indexInMaster),
                        cursor: canEdit ? 'move' : 'not-allowed',
                        opacity: canEdit ? 1 : 0.75,
                        background: cellBg,
                        borderColor: cellBorder
                      }}
                      onMouseDown={(e) => handleMoveMouseDown(e, mod)}
                      onTouchStart={(e) => handleMoveTouchStart(e, mod)}
                    >
                      {/* Fondo de Imagen o Video del módulo en el LayoutPreview */}
                      {!isSelected && mod.content?.moduleBgType === 'image' && mod.content?.moduleBgImage && (
                        <div className="layout-preview-cell-media-bg" style={{ opacity: (mod.content.moduleBgOpacity !== undefined ? mod.content.moduleBgOpacity : 1.0) * 0.35 }}>
                          <img
                            src={mod.content.moduleBgImage}
                            alt=""
                            className={`preview-media-content ${mod.content.moduleBgObjectFit || 'cover'}`}
                            style={{ objectFit: mod.content.moduleBgObjectFit || 'cover' }}
                          />
                        </div>
                      )}
                      {!isSelected && mod.content?.moduleBgType === 'video' && mod.content?.moduleBgVideo && (
                        <div className="layout-preview-cell-media-bg" style={{ opacity: (mod.content.moduleBgOpacity !== undefined ? mod.content.moduleBgOpacity : 1.0) * 0.35 }}>
                          <video
                            src={mod.content.moduleBgVideo}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className={`preview-media-content ${mod.content.moduleBgObjectFit || 'cover'}`}
                            style={{ objectFit: mod.content.moduleBgObjectFit || 'cover' }}
                          />
                        </div>
                      )}

                      {mod.type === 'media' && mod.content?.src && (
                        <div className="layout-preview-cell-media-bg">
                          {isVideo(mod.content.src, mod.content.mediaType) ? (
                            <video
                              src={mod.content.src}
                              muted
                              loop
                              autoPlay
                              playsInline
                              className={`preview-media-content ${mod.content.objectFit || 'contain'}`}
                              style={{ objectFit: mod.content.objectFit || 'contain' }}
                            />
                          ) : (
                            <img
                              src={mod.content.src}
                              alt=""
                              className={`preview-media-content ${mod.content.objectFit || 'contain'}`}
                              style={{ objectFit: mod.content.objectFit || 'contain' }}
                            />
                          )}
                        </div>
                      )}

                      <div className="layout-preview-cell-content">
                        <span className="layout-preview-cell-icon">
                          {MODULE_TYPES[mod.type]?.icon}
                        </span>
                        <span className="layout-preview-cell-label">
                          {mod.label} {!canEdit && '🔒'}
                        </span>
                        {isHidden && <span className="layout-preview-cell-hidden-tag">Oculto</span>}
                      </div>

                      {/* Acciones rápidas (hover overlay) */}
                      <div className="layout-preview-cell-actions">
                        <button
                          type="button"
                          className="layout-preview-cell-btn visibility-btn"
                          title={isHidden ? "Mostrar módulo" : "Ocultar módulo"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEdit) updateModule(mod.id, { visible: isHidden });
                          }}
                          disabled={!canEdit}
                          style={{
                            opacity: canEdit ? 1 : 0.3,
                            cursor: canEdit ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {isHidden ? '👁' : '🕶'}
                        </button>
                        <button
                          type="button"
                          className="layout-preview-cell-btn delete-btn"
                          title="Eliminar módulo"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEdit && window.confirm(`¿Eliminar el módulo "${mod.label}"?`)) {
                              removeModule(mod.id);
                            }
                          }}
                          disabled={!canEdit}
                          style={{
                            opacity: canEdit ? 1 : 0.3,
                            cursor: canEdit ? 'pointer' : 'not-allowed'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Manejadores de Redimensionamiento */}
                      {isSelected && canEdit && (
                        <>
                          {/* Lados */}
                          <div
                            className="resize-handle handle-n"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'n')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'n')}
                          />
                          <div
                            className="resize-handle handle-s"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 's')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 's')}
                          />
                          <div
                            className="resize-handle handle-e"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'e')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'e')}
                          />
                          <div
                            className="resize-handle handle-w"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'w')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'w')}
                          />
                          {/* Esquinas */}
                          <div
                            className="resize-handle handle-nw"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'nw')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'nw')}
                          />
                          <div
                            className="resize-handle handle-ne"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'ne')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'ne')}
                          />
                          <div
                            className="resize-handle handle-sw"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'sw')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'sw')}
                          />
                          <div
                            className="resize-handle handle-se"
                            onMouseDown={(e) => handleResizeMouseDown(e, mod, 'se')}
                            onTouchStart={(e) => handleResizeTouchStart(e, mod, 'se')}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Vista en Vivo con pestañas de comparación */}
          <div className={`layout-preview-panel horizontal-preview ${activeTab === 'live' ? 'mobile-active' : 'mobile-hidden'}`}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`admin-btn admin-btn-sm ${liveViewMode === 'live' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'uppercase', height: 'auto', fontWeight: 'bold' }}
                  onClick={() => setLiveViewMode('live')}
                >
                  🖥️ Pantalla Pública (En Vivo)
                </button>
                <button
                  type="button"
                  className={`admin-btn admin-btn-sm ${liveViewMode === 'draft' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'uppercase', height: 'auto', fontWeight: 'bold', position: 'relative' }}
                  onClick={() => setLiveViewMode('draft')}
                >
                  📝 Borrador con Cambios
                  {hasPendingChanges && (
                    <span style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '7px',
                      height: '7px',
                      background: '#ef5350',
                      borderRadius: '50%'
                    }} />
                  )}
                </button>
              </div>

              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                PROPORCIÓN: {previewType === 'horizontal' ? '16:9' : previewType === 'vertical' ? '9:16' : previewType === '12x6' ? '2:1' : '1:1'}
              </span>
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%', padding: 0 }}>
              <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <LivePreview modules={targetModules} grid={targetGrid} screenType={previewType} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
