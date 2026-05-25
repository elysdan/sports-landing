import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCMS, MODULE_TYPES } from '../context/CMSContext';
import { RenderModule } from './DisplayView';
import MediaLibraryModal from '../components/MediaLibraryModal';

/* ═══════════════════════════════════════════
   MODULE EDITOR — Dynamic form per module type
   ═══════════════════════════════════════════ */
function ModuleEditor({ module, updateModule, updateModuleContent, removeModule, onOpenLibrary }) {
  const handleContentChange = (field, value) => {
    updateModuleContent(module.id, { [field]: value });
  };

  const handleGridChange = (field, value) => {
    updateModule(module.id, {
      gridPosition: { ...module.gridPosition, [field]: parseInt(value) || 1 },
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const isVid = file.type.startsWith('video');
      const base64 = ev.target.result;

      // Enviar el archivo base64 al endpoint local de Vite
      fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          base64: base64,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            updateModuleContent(module.id, {
              src: data.url,
              mediaType: isVid ? 'video' : (file.name.endsWith('.gif') ? 'gif' : 'image'),
            });
          } else {
            console.error('Error al subir archivo:', data.error);
            alert('Error al subir el archivo: ' + (data.error || 'Desconocido'));
          }
        })
        .catch((err) => {
          console.error('Error de red al subir archivo:', err);
          alert('Error de red al intentar subir el archivo.');
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFromLibrary = (url, type) => {
    updateModuleContent(module.id, { src: url, mediaType: type });
  };

  return (
    <div className="admin-main-scroll">
      {/* Editor Header */}
      <div className="editor-header">
        <div>
          <div className="editor-title">{module.label}</div>
        </div>
        <div className="editor-badge">
          <span>{MODULE_TYPES[module.type]?.icon}</span>
          <span>{MODULE_TYPES[module.type]?.label}</span>
        </div>
      </div>

      {/* General Config with Visibility */}
      <div className="editor-section">
        <div className="editor-section-title">Configuración General</div>
        <div className="field-row" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'center', gap: '24px' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre del módulo</label>
            <input
              type="text"
              value={module.label}
              onChange={(e) => updateModule(module.id, { label: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Visibilidad en Valla</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', color: 'var(--color-white)' }}>
              <input
                type="checkbox"
                checked={module.visible !== false}
                onChange={(e) => updateModule(module.id, { visible: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }}
              />
              Visible
            </label>
          </div>
        </div>
      </div>

      {/* Grid Position */}
      <div className="editor-section">
        <div className="editor-section-title">Posición en Grid</div>
        <div className="grid-position-editor">
          <div className="field">
            <label>Columna</label>
            <input type="number" min="1" value={module.gridPosition.col} onChange={(e) => handleGridChange('col', e.target.value)} />
          </div>
          <div className="field">
            <label>Fila</label>
            <input type="number" min="1" value={module.gridPosition.row} onChange={(e) => handleGridChange('row', e.target.value)} />
          </div>
          <div className="field">
            <label>Ancho (cols)</label>
            <input type="number" min="1" value={module.gridPosition.colSpan} onChange={(e) => handleGridChange('colSpan', e.target.value)} />
          </div>
          <div className="field">
            <label>Alto (rows)</label>
            <input type="number" min="1" value={module.gridPosition.rowSpan} onChange={(e) => handleGridChange('rowSpan', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Type-specific content editor */}
      <div className="editor-section">
        <div className="editor-section-title">Contenido</div>
        {module.type === 'media' && (
          <MediaEditor
            content={module.content}
            onChange={handleContentChange}
            onUpload={handleImageUpload}
            onOpenLibrary={() => onOpenLibrary(handleSelectFromLibrary)}
          />
        )}
        {module.type === 'scoreboard' && (
          <ScoreboardEditor content={module.content} onChange={handleContentChange} updateModuleContent={updateModuleContent} moduleId={module.id} />
        )}
        {module.type === 'results' && (
          <ResultsEditor content={module.content} updateModuleContent={updateModuleContent} moduleId={module.id} />
        )}
        {module.type === 'upcoming' && (
          <UpcomingEditor content={module.content} onChange={handleContentChange} />
        )}
        {module.type === 'news' && (
          <NewsEditor content={module.content} onChange={handleContentChange} />
        )}
        {module.type === 'ticker' && (
          <TickerEditor content={module.content} updateModuleContent={updateModuleContent} moduleId={module.id} />
        )}
      </div>

      {/* Botones de Acción */}
      <div className="editor-section" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => removeModule(module.id)}
        >
          🗑️ Eliminar Módulo
        </button>
      </div>
    </div>
  );
}

/* ─── Media Editor ─── */
function MediaEditor({ content, onChange, onUpload, onOpenLibrary }) {
  return (
    <>
      <div className="media-upload-zone">
        <div className="media-upload-icon">📁</div>
        <div className="media-upload-label">Haz clic o arrastra un archivo</div>
        <div className="media-upload-formats">Soporta: JPG, PNG, GIF, MP4, WebM</div>
        <input type="file" accept="image/*,video/mp4,video/webm,.gif" onChange={onUpload} />
      </div>

      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        style={{ width: '100%', marginTop: '8px', justifyContent: 'center', gap: '8px' }}
        onClick={onOpenLibrary}
      >
        🖼️ Seleccionar de Biblioteca
      </button>

      {content.src && (
        <div className="media-preview">
          {content.mediaType === 'video' ? (
            <video className={content.objectFit || 'contain'} src={content.src} controls muted style={{ width: '100%', maxHeight: 200, objectFit: content.objectFit || 'contain' }} />
          ) : (
            <img className={content.objectFit || 'contain'} src={content.src} alt="Preview" style={{ objectFit: content.objectFit || 'contain' }} />
          )}
          <button className="media-preview-remove" onClick={() => onChange('src', '')}>✕</button>
        </div>
      )}

      <div className="field" style={{ marginTop: 16 }}>
        <label>Texto superpuesto (overlay)</label>
        <textarea value={content.overlayText || ''} onChange={(e) => onChange('overlayText', e.target.value)} placeholder="Opcional: texto sobre la imagen" />
      </div>

      <div className="field">
        <label>Ajuste de imagen</label>
        <select value={content.objectFit || 'contain'} onChange={(e) => onChange('objectFit', e.target.value)}>
          <option value="cover">Cubrir (cover)</option>
          <option value="contain">Contener (contain)</option>
          <option value="fill">Rellenar / Estirar (fill)</option>
        </select>
      </div>

      <div className="field">
        <label>
          <input type="checkbox" checked={content.showBrandOverlay || false} onChange={(e) => onChange('showBrandOverlay', e.target.checked)} style={{ marginRight: 8 }} />
          Mostrar overlay de marca (estilo casino)
        </label>
      </div>

      <div className="field">
        <label>Texto alternativo</label>
        <input type="text" value={content.alt || ''} onChange={(e) => onChange('alt', e.target.value)} />
      </div>
    </>
  );
}

/* ─── Scoreboard Editor ─── */
function ScoreboardEditor({ content, updateModuleContent, moduleId }) {
  const update = (team, field, value) => {
    updateModuleContent(moduleId, {
      [team]: { ...content[team], [field]: field === 'score' ? (parseInt(value) || 0) : value },
    });
  };

  return (
    <>
      <div className="field-row">
        <div className="field">
          <label>Equipo A — Nombre</label>
          <input type="text" value={content.teamA.name} onChange={(e) => update('teamA', 'name', e.target.value)} />
        </div>
        <div className="field">
          <label>Equipo A — Código</label>
          <input type="text" value={content.teamA.code} onChange={(e) => update('teamA', 'code', e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Equipo A — Goles</label>
          <input type="number" value={content.teamA.score} onChange={(e) => update('teamA', 'score', e.target.value)} />
        </div>
        <div className="field">
          <label>Equipo A — Bandera (emoji)</label>
          <input type="text" value={content.teamA.flag} onChange={(e) => update('teamA', 'flag', e.target.value)} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      <div className="field-row">
        <div className="field">
          <label>Equipo B — Nombre</label>
          <input type="text" value={content.teamB.name} onChange={(e) => update('teamB', 'name', e.target.value)} />
        </div>
        <div className="field">
          <label>Equipo B — Código</label>
          <input type="text" value={content.teamB.code} onChange={(e) => update('teamB', 'code', e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Equipo B — Goles</label>
          <input type="number" value={content.teamB.score} onChange={(e) => update('teamB', 'score', e.target.value)} />
        </div>
        <div className="field">
          <label>Equipo B — Bandera (emoji)</label>
          <input type="text" value={content.teamB.flag} onChange={(e) => update('teamB', 'flag', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Estado del partido</label>
        <input type="text" value={content.status || ''} onChange={(e) => updateModuleContent(moduleId, { status: e.target.value })} />
      </div>
    </>
  );
}

/* ─── Results Editor ─── */
function ResultsEditor({ content, updateModuleContent, moduleId }) {
  const updateMatch = (idx, field, value) => {
    const updated = [...(content.matches || [])];
    updated[idx] = { ...updated[idx], [field]: field.startsWith('score') ? (parseInt(value) || 0) : value };
    updateModuleContent(moduleId, { matches: updated });
  };

  const addMatch = () => {
    updateModuleContent(moduleId, {
      matches: [...(content.matches || []), { teamA: 'EQUIPO A', teamB: 'EQUIPO B', scoreA: 0, scoreB: 0 }],
    });
  };

  const removeMatch = (idx) => {
    updateModuleContent(moduleId, {
      matches: content.matches.filter((_, i) => i !== idx),
    });
  };

  return (
    <>
      <div className="field">
        <label>Título</label>
        <input type="text" value={content.title} onChange={(e) => updateModuleContent(moduleId, { title: e.target.value })} />
      </div>

      {(content.matches || []).map((match, i) => (
        <div className="match-editor-row" key={i}>
          <div className="field">
            <label>Equipo A</label>
            <input type="text" value={match.teamA} onChange={(e) => updateMatch(i, 'teamA', e.target.value)} />
          </div>
          <div className="field">
            <label>G-A</label>
            <input type="number" value={match.scoreA} onChange={(e) => updateMatch(i, 'scoreA', e.target.value)} />
          </div>
          <div className="field">
            <label>G-B</label>
            <input type="number" value={match.scoreB} onChange={(e) => updateMatch(i, 'scoreB', e.target.value)} />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'end', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <label>Equipo B</label>
              <input type="text" value={match.teamB} onChange={(e) => updateMatch(i, 'teamB', e.target.value)} />
            </div>
            <button className="admin-btn-icon danger" onClick={() => removeMatch(i)} style={{ marginBottom: 0 }}>✕</button>
          </div>
        </div>
      ))}

      <button className="add-module-btn" onClick={addMatch}>+ Agregar partido</button>
    </>
  );
}

/* ─── Upcoming Editor ─── */
function UpcomingEditor({ content, onChange }) {
  return (
    <>
      <div className="field">
        <label>Etiqueta</label>
        <input type="text" value={content.label} onChange={(e) => onChange('label', e.target.value)} />
      </div>
      <div className="field">
        <label>Hora</label>
        <input type="text" value={content.time} onChange={(e) => onChange('time', e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Equipo A</label>
          <input type="text" value={content.teamA} onChange={(e) => onChange('teamA', e.target.value)} />
        </div>
        <div className="field">
          <label>Equipo B</label>
          <input type="text" value={content.teamB} onChange={(e) => onChange('teamB', e.target.value)} />
        </div>
      </div>
    </>
  );
}

/* ─── News Editor ─── */
function NewsEditor({ content, onChange }) {
  return (
    <>
      <div className="field">
        <label>Título</label>
        <input type="text" value={content.title} onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div className="field">
        <label>Contenido</label>
        <textarea value={content.content} onChange={(e) => onChange('content', e.target.value)} />
      </div>
    </>
  );
}

/* ─── Ticker Editor ─── */
function TickerEditor({ content, updateModuleContent, moduleId }) {
  const updateMessage = (idx, value) => {
    const updated = [...content.messages];
    updated[idx] = value;
    updateModuleContent(moduleId, { messages: updated });
  };

  return (
    <>
      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={content.isLive}
            onChange={(e) => updateModuleContent(moduleId, { isLive: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          Mostrar badge "EN VIVO"
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Mensajes del ticker
        </label>
        {(content.messages || []).map((msg, i) => (
          <div className="ticker-item-editor" key={i}>
            <input
              type="text"
              value={msg}
              onChange={(e) => updateMessage(i, e.target.value)}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--color-white)',
                fontFamily: 'var(--font-body)', fontSize: 14,
              }}
            />
            <button
              className="admin-btn-icon danger"
              onClick={() => {
                updateModuleContent(moduleId, {
                  messages: content.messages.filter((_, j) => j !== i),
                });
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="add-module-btn"
          onClick={() => updateModuleContent(moduleId, { messages: [...content.messages, 'Nuevo mensaje...'] })}
        >
          + Agregar mensaje
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   LAYOUT PREVIEW — Interactive blueprint builder
   ═══════════════════════════════════════════ */
/* ─── LIVE PREVIEW — Miniature scaled preview ─── */
function LivePreview({ modules, grid, screenType }) {
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
        background: '#050505',
        borderRadius: 'var(--radius-sm)'
      }}
    >
      <div
        className={`billboard-grid ${labelClass}`}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: Array.from({ length: grid.rows }).map((_, i) => 
            visibleModules.some(m => m.type === 'ticker' && m.gridPosition.row === i + 1) ? '80px' : '1fr'
          ).join(' '),
          background: 'var(--color-border)',
          gap: '2px',
          display: 'grid',
          position: 'absolute',
          flexShrink: 0
        }}
      >
        {visibleModules.map((mod) => {
          const indexInMaster = modules.findIndex((m) => m.id === mod.id);
          return (
            <div
              key={mod.id}
              className="module-cell"
              style={{
                gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
                gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
                zIndex: modules.length - indexInMaster,
              }}
            >
              <RenderModule module={mod} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LAYOUT PREVIEW — Interactive blueprint builder
   ═══════════════════════════════════════════ */
function LayoutPreview({ modules, grid, selectedId, onSelect, updateModule, removeModule }) {
  const [dragState, setDragState] = useState(null);
  const gridRef = useRef(null);
  const [activeTab, setActiveTab] = useState('blueprint'); // 'blueprint' or 'live'
  const [previewType, setPreviewType] = useState('horizontal'); // 'horizontal', 'vertical', '12x6', '9x9'

  // Generar celdas de cuadrícula de fondo estilo blueprint (optimizado con useMemo)
  const bgCells = useMemo(() => {
    const cells = [];
    for (let r = 1; r <= grid.rows; r++) {
      for (let c = 1; c <= grid.cols; c++) {
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
  }, [grid.rows, grid.cols]);

  // Iniciar Arrastre para Mover (Mouse)
  const handleMoveMouseDown = (e, mod) => {
    if (e.target.closest('.layout-preview-cell-btn')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onSelect(mod.id);

    setDragState({
      type: 'move',
      moduleId: mod.id,
      startX: e.clientX,
      startY: e.clientY,
      startCol: mod.gridPosition.col,
      startRow: mod.gridPosition.row,
    });
  };

  // Iniciar Arrastre para Mover (Touch)
  const handleMoveTouchStart = (e, mod) => {
    if (e.target.closest('.layout-preview-cell-btn')) {
      return;
    }
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    onSelect(mod.id);

    const touch = e.touches[0];
    setDragState({
      type: 'move',
      moduleId: mod.id,
      startX: touch.clientX,
      startY: touch.clientY,
      startCol: mod.gridPosition.col,
      startRow: mod.gridPosition.row,
    });
  };

  // Iniciar Redimensionamiento (Mouse)
  const handleResizeMouseDown = (e, mod, direction) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(mod.id);

    setDragState({
      type: 'resize',
      direction,
      moduleId: mod.id,
      startX: e.clientX,
      startY: e.clientY,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
    });
  };

  // Iniciar Redimensionamiento (Touch)
  const handleResizeTouchStart = (e, mod, direction) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    onSelect(mod.id);

    const touch = e.touches[0];
    setDragState({
      type: 'resize',
      direction,
      moduleId: mod.id,
      startX: touch.clientX,
      startY: touch.clientY,
      startColSpan: mod.gridPosition.colSpan,
      startRowSpan: mod.gridPosition.rowSpan,
    });
  };

  // Controlar eventos del ratón y touch globales durante el arrastre
  useEffect(() => {
    if (!dragState) return;

    const handleDragMove = (clientX, clientY) => {
      const dx = clientX - dragState.startX;
      const dy = clientY - dragState.startY;

      const gridEl = gridRef.current;
      if (!gridEl) return;
      const rect = gridEl.getBoundingClientRect();
      const cellWidth = rect.width / grid.cols;
      const cellHeight = rect.height / grid.rows;

      const mod = modules.find((m) => m.id === dragState.moduleId);
      if (!mod) return;

      if (dragState.type === 'move') {
        const colDiff = Math.round(dx / cellWidth);
        const rowDiff = Math.round(dy / cellHeight);

        let newCol = dragState.startCol + colDiff;
        let newRow = dragState.startRow + rowDiff;

        // Limitar dentro del grid
        newCol = Math.max(1, Math.min(grid.cols - mod.gridPosition.colSpan + 1, newCol));
        newRow = Math.max(1, Math.min(grid.rows - mod.gridPosition.rowSpan + 1, newRow));

        updateModule(dragState.moduleId, {
          gridPosition: {
            ...mod.gridPosition,
            col: newCol,
            row: newRow,
          },
        });
      } else if (dragState.type === 'resize') {
        const colSpanDiff = Math.round(dx / cellWidth);
        const rowSpanDiff = Math.round(dy / cellHeight);

        let newColSpan = dragState.startColSpan;
        let newRowSpan = dragState.startRowSpan;

        if (dragState.direction === 'e' || dragState.direction === 'se') {
          newColSpan = dragState.startColSpan + colSpanDiff;
          newColSpan = Math.max(1, Math.min(grid.cols - mod.gridPosition.col + 1, newColSpan));
        }

        if (dragState.direction === 's' || dragState.direction === 'se') {
          newRowSpan = dragState.startRowSpan + rowSpanDiff;
          newRowSpan = Math.max(1, Math.min(grid.rows - mod.gridPosition.row + 1, newRowSpan));
        }

        updateModule(dragState.moduleId, {
          gridPosition: {
            ...mod.gridPosition,
            colSpan: newColSpan,
            rowSpan: newRowSpan,
          },
        });
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
    <div className="layout-preview-container">
      <div className="layout-preview-header">
        <div className="layout-preview-label" style={{ marginBottom: 0 }}>
          Diseño y Vista Previa (Arrastra o redimensiona)
        </div>
        
        {/* Selector de Pantalla en Vivo para la previsualización */}
        <div className="layout-preview-screen-select" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', marginRight: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Proporción:</span>
          <select
            value={previewType}
            onChange={(e) => setPreviewType(e.target.value)}
            style={{
              padding: '4px 10px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-white)',
              fontSize: '11px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-body)'
            }}
          >
            <option value="horizontal">🖥️ Horizontal (16:9)</option>
            <option value="vertical">📱 Vertical (9:16)</option>
            <option value="12x6">📐 Pantalla 12x6 Mts (2:1)</option>
            <option value="9x9">⬛ Pantalla 9x9 Mts (1:1)</option>
          </select>
        </div>

        {/* Tab Selector for mobile */}
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
      </div>
      <div className="layout-preview-panels">
        {/* Panel Izquierdo: Vista en Vivo con dropdown */}
        <div className={`layout-preview-panel horizontal-preview ${activeTab === 'live' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span className="panel-icon">👁️</span> Vista en Vivo: {
                previewType === 'horizontal' ? 'Horizontal (16:9)' :
                previewType === 'vertical' ? 'Vertical (9:16)' :
                previewType === '12x6' ? 'Pantalla 12.00 x 6.00 Mts (2:1)' :
                'Pantalla 9.00 x 9.00 Mts (1:1)'
              }
            </span>
            <span style={{ fontSize: '9px', color: 'var(--color-gold)', letterSpacing: '0.5px' }}>
              {
                previewType === 'horizontal' ? '1920x1080' :
                previewType === 'vertical' ? '1080x1920' :
                previewType === '12x6' ? '768x384 (Exposición 72m²)' :
                '576x576 (Exposición 81m²)'
              }
            </span>
          </div>
          <div className="panel-content">
            <LivePreview modules={modules} grid={grid} screenType={previewType} />
          </div>
        </div>

        {/* Panel Derecho: Recuadros Editor */}
        <div className={`layout-preview-panel center-blueprint ${activeTab === 'blueprint' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="panel-header">
            <span className="panel-icon">📐</span> Editor de Recuadros (Grid {grid.cols}x{grid.rows})
          </div>
          <div className="panel-content">
            <div
              ref={gridRef}
              className="layout-preview-grid"
              style={{
                gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
                aspectRatio: 
                  previewType === 'horizontal' ? '16/9' :
                  previewType === 'vertical' ? '9/16' :
                  previewType === '12x6' ? '2/1' : '1/1'
              }}
            >
              {/* Cuadrícula de diseño blueprint de fondo */}
              {bgCells}

              {/* Celdas interactivas de módulos */}
              {modules.map((mod) => {
                const isSelected = selectedId === mod.id;
                const isHidden = mod.visible === false;
                const indexInMaster = modules.findIndex((m) => m.id === mod.id);

                return (
                  <div
                    key={mod.id}
                    className={`layout-preview-cell ${isSelected ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                    style={{
                      gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
                      gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
                      zIndex: isSelected ? 100 : (modules.length - indexInMaster),
                    }}
                    onMouseDown={(e) => handleMoveMouseDown(e, mod)}
                    onTouchStart={(e) => handleMoveTouchStart(e, mod)}
                  >
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
                      <span className="layout-preview-cell-label">{mod.label}</span>
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
                          updateModule(mod.id, { visible: isHidden });
                        }}
                      >
                        {isHidden ? '👁️' : '🕶️'}
                      </button>
                      <button
                        type="button"
                        className="layout-preview-cell-btn delete-btn"
                        title="Eliminar módulo"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Eliminar el módulo "${mod.label}"?`)) {
                            removeModule(mod.id);
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Manejadores de Redimensionamiento */}
                    {isSelected && (
                      <>
                        <div
                          className="resize-handle handle-e"
                          onMouseDown={(e) => handleResizeMouseDown(e, mod, 'e')}
                          onTouchStart={(e) => handleResizeTouchStart(e, mod, 'e')}
                        />
                        <div
                          className="resize-handle handle-s"
                          onMouseDown={(e) => handleResizeMouseDown(e, mod, 's')}
                          onTouchStart={(e) => handleResizeTouchStart(e, mod, 's')}
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN PANEL — Full screen CMS
   ═══════════════════════════════════════════ */
export default function AdminPanel() {
  const { data, addModule, removeModule, updateModule, updateModuleContent, moveModule, updateGrid, updateOrientation, resetAll } = useCMS();
  const [selectedId, setSelectedId] = useState(data.modules[0]?.id || null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Estados para la Biblioteca de Medios
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaSelectCallback, setMediaSelectCallback] = useState(null);

  const selectedModule = data.modules.find((m) => m.id === selectedId);

  const handleAddModule = useCallback((type) => {
    const newId = addModule(type);
    setSelectedId(newId);
    setShowAddMenu(false);
  }, [addModule]);

  const handleRemove = useCallback((id) => {
    if (!window.confirm('¿Eliminar este módulo?')) return;
    removeModule(id);
    setSelectedId(data.modules.find((m) => m.id !== id)?.id || null);
  }, [removeModule, data.modules]);

  const openMediaLibraryForSelection = useCallback((callback) => {
    setMediaSelectCallback(() => callback);
    setMediaModalOpen(true);
  }, []);

  return (
    <div className="admin-layout">
      {/* ─── Header ─── */}
      <div className="admin-header">
        <div className="admin-logo">
          <div className="admin-logo-icon">♣</div>
          <div className="admin-logo-text">
            Billboard <span>CMS</span>
          </div>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => {
              setMediaSelectCallback(null);
              setMediaModalOpen(true);
            }}
          >
            🖼️ Biblioteca
          </button>
          
          <span style={{ borderLeft: '1px solid var(--color-border)', height: '20px', margin: '0 8px' }} />

          <Link to="/" className="admin-btn admin-btn-primary admin-btn-sm" target="_blank">
            👁️ Ver Valla (16:9)
          </Link>
          <Link to="/?screen=12x6" className="admin-btn admin-btn-secondary admin-btn-sm" target="_blank">
            🖥️ Valla 12x6 (2:1)
          </Link>
          <Link to="/?screen=9x9" className="admin-btn admin-btn-secondary admin-btn-sm" target="_blank">
            ⬛ Valla 9x9 (1:1)
          </Link>

          <span style={{ borderLeft: '1px solid var(--color-border)', height: '20px', margin: '0 8px' }} />

          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => { if (window.confirm('¿Restablecer todo a valores por defecto?')) resetAll(); }}>
            Restablecer
          </button>
        </div>
      </div>

      {/* ─── Sidebar — Module List ─── */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">Módulos</div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{data.modules.length}</span>
        </div>

        {/* Control del Tamaño de la Cuadrícula */}
        <div className="grid-size-selector">
          <div className="grid-size-selector-title">Cuadrícula</div>
          <div className="grid-size-selector-inputs">
            <div className="grid-size-field">
              <label>Columnas (Cols)</label>
              <select
                value={data.grid.cols}
                onChange={(e) => updateGrid({ cols: parseInt(e.target.value) || 1 })}
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="grid-size-field">
              <label>Filas (Rows)</label>
              <select
                value={data.grid.rows}
                onChange={(e) => updateGrid({ rows: parseInt(e.target.value) || 1 })}
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-sidebar-list">
          {data.modules.map((mod, idx) => {
            const isHidden = mod.visible === false;
            return (
              <div
                key={mod.id}
                className={`module-list-item ${selectedId === mod.id ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                onClick={() => setSelectedId(mod.id)}
              >
                <span className="module-list-icon">{MODULE_TYPES[mod.type]?.icon}</span>
                <div className="module-list-info">
                  <div className="module-list-label">{mod.label}</div>
                  <div className="module-list-type">
                    {MODULE_TYPES[mod.type]?.label} {isHidden && '(Oculto)'}
                  </div>
                </div>
                <div className="module-list-actions">
                  <button
                    className={`module-list-action-btn ${isHidden ? '' : 'active-visible'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateModule(mod.id, { visible: isHidden });
                    }}
                    title={isHidden ? "Mostrar en la valla" : "Ocultar en la valla"}
                  >
                    {isHidden ? '👁️' : '🕶️'}
                  </button>
                  <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'up'); }} title="Mover arriba" disabled={idx === 0}>↑</button>
                  <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'down'); }} title="Mover abajo" disabled={idx === data.modules.length - 1}>↓</button>
                  <button className="module-list-action-btn danger" onClick={(e) => { e.stopPropagation(); handleRemove(mod.id); }} title="Eliminar">✕</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-sidebar-footer">
          {showAddMenu ? (
            <div className="add-module-menu">
              {Object.entries(MODULE_TYPES).map(([key, type]) => (
                <button key={key} className="add-module-option" onClick={() => handleAddModule(key)}>
                  <span className="add-module-option-icon">{type.icon}</span>
                  <div>
                    <div className="add-module-option-label">{type.label}</div>
                    <div className="add-module-option-desc">{type.description}</div>
                  </div>
                </button>
              ))}
              <button className="add-module-btn" style={{ marginTop: 8 }} onClick={() => setShowAddMenu(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="add-module-btn" onClick={() => setShowAddMenu(true)}>
              + Agregar Módulo
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Content — Editor ─── */}
      <div className="admin-main">
        {selectedModule ? (
          <>
            <div className="layout-preview-wrapper">
              <LayoutPreview
                modules={data.modules}
                grid={data.grid}
                selectedId={selectedId}
                onSelect={setSelectedId}
                updateModule={updateModule}
                removeModule={handleRemove}
              />
            </div>
            <ModuleEditor
              key={selectedModule.id}
              module={selectedModule}
              updateModule={updateModule}
              updateModuleContent={updateModuleContent}
              removeModule={handleRemove}
              onOpenLibrary={openMediaLibraryForSelection}
            />
          </>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📋</div>
            <div className="admin-empty-text">Selecciona un módulo</div>
            <div className="admin-empty-hint">O agrega uno nuevo desde la barra lateral</div>
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={mediaSelectCallback}
      />
    </div>
  );
}

function isVideo(src, mediaType) {
  if (mediaType === 'video') return true;
  if (!src) return false;
  return src.match(/\.(mp4|webm|ogg)(\?|$)/i) || src.startsWith('data:video');
}
