import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCMS, MODULE_TYPES, defaultContentForType } from '../context/CMSContext';

/* ═══════════════════════════════════════════
   MODULE EDITOR — Dynamic form per module type
   ═══════════════════════════════════════════ */
function ModuleEditor({ module, updateModule, updateModuleContent }) {
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
      updateModuleContent(module.id, {
        src: ev.target.result,
        mediaType: isVid ? 'video' : (file.name.endsWith('.gif') ? 'gif' : 'image'),
      });
    };
    reader.readAsDataURL(file);
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

      {/* Label */}
      <div className="editor-section">
        <div className="editor-section-title">Configuración General</div>
        <div className="field">
          <label>Nombre del módulo</label>
          <input
            type="text"
            value={module.label}
            onChange={(e) => updateModule(module.id, { label: e.target.value })}
          />
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
          <MediaEditor content={module.content} onChange={handleContentChange} onUpload={handleImageUpload} />
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
    </div>
  );
}

/* ─── Media Editor ─── */
function MediaEditor({ content, onChange, onUpload }) {
  return (
    <>
      <div className="media-upload-zone">
        <div className="media-upload-icon">📁</div>
        <div className="media-upload-label">Haz clic o arrastra un archivo</div>
        <div className="media-upload-formats">Soporta: JPG, PNG, GIF, MP4, WebM</div>
        <input type="file" accept="image/*,video/mp4,video/webm,.gif" onChange={onUpload} />
      </div>

      {content.src && (
        <div className="media-preview">
          {content.mediaType === 'video' ? (
            <video src={content.src} controls muted style={{ width: '100%', maxHeight: 200 }} />
          ) : (
            <img src={content.src} alt="Preview" />
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
        <select value={content.objectFit || 'cover'} onChange={(e) => onChange('objectFit', e.target.value)}>
          <option value="cover">Cubrir (cover)</option>
          <option value="contain">Contener (contain)</option>
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
   LAYOUT PREVIEW — Mini grid view
   ═══════════════════════════════════════════ */
function LayoutPreview({ modules, grid, selectedId, onSelect }) {
  return (
    <div className="layout-preview-container">
      <div className="layout-preview-label">Vista previa del layout</div>
      <div
        className="layout-preview-grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }}
      >
        {modules.map((mod) => (
          <div
            key={mod.id}
            className={`layout-preview-cell ${selectedId === mod.id ? 'active' : ''}`}
            style={{
              gridColumn: `${mod.gridPosition.col} / span ${mod.gridPosition.colSpan}`,
              gridRow: `${mod.gridPosition.row} / span ${mod.gridPosition.rowSpan}`,
            }}
            onClick={() => onSelect(mod.id)}
          >
            <div className="layout-preview-cell-label">
              {MODULE_TYPES[mod.type]?.icon} {mod.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN PANEL — Full screen CMS
   ═══════════════════════════════════════════ */
export default function AdminPanel() {
  const { data, addModule, removeModule, updateModule, updateModuleContent, moveModule, resetAll } = useCMS();
  const [selectedId, setSelectedId] = useState(data.modules[0]?.id || null);
  const [showAddMenu, setShowAddMenu] = useState(false);

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
          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => { if (window.confirm('¿Restablecer todo a valores por defecto?')) resetAll(); }}>
            Restablecer
          </button>
          <Link to="/" className="admin-btn admin-btn-primary admin-btn-sm" target="_blank">
            👁️ Ver Valla
          </Link>
        </div>
      </div>

      {/* ─── Sidebar — Module List ─── */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">Módulos</div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{data.modules.length}</span>
        </div>

        <div className="admin-sidebar-list">
          {data.modules.map((mod, idx) => (
            <div
              key={mod.id}
              className={`module-list-item ${selectedId === mod.id ? 'active' : ''}`}
              onClick={() => setSelectedId(mod.id)}
            >
              <span className="module-list-icon">{MODULE_TYPES[mod.type]?.icon}</span>
              <div className="module-list-info">
                <div className="module-list-label">{mod.label}</div>
                <div className="module-list-type">{MODULE_TYPES[mod.type]?.label}</div>
              </div>
              <div className="module-list-actions">
                <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'up'); }} title="Mover arriba" disabled={idx === 0}>↑</button>
                <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'down'); }} title="Mover abajo" disabled={idx === data.modules.length - 1}>↓</button>
                <button className="module-list-action-btn danger" onClick={(e) => { e.stopPropagation(); handleRemove(mod.id); }} title="Eliminar">✕</button>
              </div>
            </div>
          ))}
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
            <div style={{ padding: '16px 48px 0' }}>
              <LayoutPreview
                modules={data.modules}
                grid={data.grid}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <ModuleEditor
              key={selectedModule.id}
              module={selectedModule}
              updateModule={updateModule}
              updateModuleContent={updateModuleContent}
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
    </div>
  );
}
