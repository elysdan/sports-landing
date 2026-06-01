import { useState, useCallback, useEffect, useRef, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useCMS, MODULE_TYPES } from '../context/CMSContext';
import { RenderModule, getVerticalLayout } from './DisplayView';
import MediaLibraryModal from '../components/MediaLibraryModal';

/* ═══════════════════════════════════════════
   MODULE EDITOR — Dynamic form per module type
   ═══════════════════════════════════════════ */
function ModuleEditor({ module, updateModule, updateModuleContent, removeModule, onOpenLibrary, canEdit }) {
  const handleContentChange = (field, value) => {
    if (!canEdit) return;
    updateModuleContent(module.id, { [field]: value });
  };

  const handleGridChange = (field, value) => {
    if (!canEdit) return;
    updateModule(module.id, {
      gridPosition: { ...module.gridPosition, [field]: parseInt(value) || 1 },
    });
  };

  const handleLayoutTextSizeChange = (value) => {
    if (!canEdit) return;
    updateModule(module.id, {
      gridPosition: { ...module.gridPosition, textSizeFactor: parseFloat(value) || 1.0 }
    });
  };

  const currentTextSizeFactor = module.gridPosition?.textSizeFactor !== undefined
    ? module.gridPosition.textSizeFactor
    : (module.content?.textSizeFactor !== undefined ? module.content.textSizeFactor : 1.0);

  const handleImageUpload = (e) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
    updateModuleContent(module.id, { src: url, mediaType: type });
  };

  return (
    <div className="admin-main-scroll">
      {/* Warning Badge if read-only */}
      {!canEdit && (
        <div style={{ background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', color: '#ef5350', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>No tienes permisos para modificar este tipo de módulo (Sólo Lectura).</span>
        </div>
      )}

      <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '24px', opacity: canEdit ? 1 : 0.85 }}>
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

        {/* Estilo del Módulo */}
        <div className="editor-section">
          <div className="editor-section-title">Estilo del Módulo</div>
          
          <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
            {/* Fondo del Módulo */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Estilo de Fondo del Módulo</label>
              <select
                value={module.content.moduleBgTransparent === true ? 'transparent' : 'solid'}
                onChange={(e) => handleContentChange('moduleBgTransparent', e.target.value === 'transparent')}
                style={{ marginTop: '6px' }}
              >
                <option value="transparent">Fondo Transparente (Elementos con fondo propio)</option>
                <option value="solid">Fondo con Color Sólido (Módulo completo)</option>
              </select>
              {module.content.moduleBgTransparent !== true && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Color de Fondo del Módulo Completo</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    <input
                      type="color"
                      value={module.content.moduleBgColor && /^#[0-9A-F]{6}$/i.test(module.content.moduleBgColor) ? module.content.moduleBgColor : '#0a0a0a'}
                      onChange={(e) => handleContentChange('moduleBgColor', e.target.value)}
                      style={{
                        width: '42px',
                        height: '42px',
                        padding: '2px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: 'transparent',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={module.content.moduleBgColor || ''}
                      onChange={(e) => handleContentChange('moduleBgColor', e.target.value)}
                      placeholder="Ej: #0a0a0a o rgba(10,10,10,0.5)"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Color de Fondo de los Elementos (Tarjetas)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <input
                    type="color"
                    value={module.content.cardBgColor && /^#[0-9A-F]{6}$/i.test(module.content.cardBgColor) ? module.content.cardBgColor : '#161616'}
                    onChange={(e) => handleContentChange('cardBgColor', e.target.value)}
                    style={{
                      width: '42px',
                      height: '42px',
                      padding: '2px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: 'transparent',
                      flexShrink: 0
                    }}
                  />
                  <input
                    type="text"
                    value={module.content.cardBgColor || ''}
                    onChange={(e) => handleContentChange('cardBgColor', e.target.value)}
                    placeholder="Ej: #161616 o rgba(255,255,255,0.05)"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Contorno / Bordes del Módulo */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Estilo del Contorno del Módulo</label>
              <select
                value={module.content.moduleBorderTransparent === true ? 'transparent' : 'color'}
                onChange={(e) => handleContentChange('moduleBorderTransparent', e.target.value === 'transparent')}
                style={{ marginTop: '6px' }}
              >
                <option value="transparent">Sin Contorno (Líneas invisibles)</option>
                <option value="color">Contorno con Color Personalizado</option>
              </select>

              {module.content.moduleBorderTransparent !== true && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Color del Contorno / Bordes</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    <input
                      type="color"
                      value={module.content.moduleBorderColor && /^#[0-9A-F]{6}$/i.test(module.content.moduleBorderColor) ? module.content.moduleBorderColor : '#2a2a2a'}
                      onChange={(e) => handleContentChange('moduleBorderColor', e.target.value)}
                      style={{
                        width: '42px',
                        height: '42px',
                        padding: '2px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: 'transparent',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={module.content.moduleBorderColor || ''}
                      onChange={(e) => handleContentChange('moduleBorderColor', e.target.value)}
                      placeholder="Ej: #2a2a2a o rgba(255,255,255,0.1)"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
            {/* Tamaño del Texto */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Tamaño de Letra (Factor de Escala)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={currentTextSizeFactor}
                  onChange={(e) => handleLayoutTextSizeChange(e.target.value)}
                  style={{ flex: 1, height: '6px', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--color-primary)', 
                  minWidth: '40px', 
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {currentTextSizeFactor.toFixed(1)}x
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Ajusta el tamaño relativo del texto del módulo sin alterar su estructura.
              </div>
            </div>

            {/* Color del Texto */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Color del Texto / Letras</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <input
                  type="color"
                  value={module.content.textColor && /^#[0-9A-F]{6}$/i.test(module.content.textColor) ? module.content.textColor : '#ffffff'}
                  onChange={(e) => handleContentChange('textColor', e.target.value)}
                  style={{
                    width: '42px',
                    height: '42px',
                    padding: '2px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'transparent',
                    flexShrink: 0
                  }}
                />
                <input
                  type="text"
                  value={module.content.textColor || ''}
                  onChange={(e) => handleContentChange('textColor', e.target.value)}
                  placeholder="Ej: #ffffff o var(--color-white)"
                  style={{ flex: 1 }}
                />
                {module.content.textColor && (
                  <button
                    type="button"
                    onClick={() => handleContentChange('textColor', '')}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      color: 'var(--color-text)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      height: '42px'
                    }}
                    title="Restablecer color por defecto"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Deja el campo vacío para usar los colores predeterminados del módulo.
              </div>
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
            <ScoreboardEditor content={module.content} onChange={handleContentChange} updateModuleContent={updateModuleContent} moduleId={module.id} onOpenLibrary={onOpenLibrary} />
          )}
          {module.type === 'results' && (
            <ResultsEditor content={module.content} updateModuleContent={updateModuleContent} moduleId={module.id} onOpenLibrary={onOpenLibrary} />
          )}
          {module.type === 'upcoming' && (
            <UpcomingEditor 
              content={module.content} 
              onChange={handleContentChange} 
              updateModuleContent={updateModuleContent}
              moduleId={module.id}
              onOpenLibrary={onOpenLibrary}
            />
          )}
          {module.type === 'news' && (
            <NewsEditor content={module.content} onChange={handleContentChange} />
          )}
          {module.type === 'ticker' && (
            <TickerEditor content={module.content} updateModuleContent={updateModuleContent} moduleId={module.id} />
          )}
          {module.type === 'apuesta' && (
            <ApuestaEditor
              content={module.content}
              onChange={handleContentChange}
              updateModuleContent={updateModuleContent}
              moduleId={module.id}
              onOpenLibrary={onOpenLibrary}
            />
          )}
          {module.type === 'pregunta' && (
            <PreguntaEditor
              content={module.content}
              onChange={handleContentChange}
              updateModuleContent={updateModuleContent}
              moduleId={module.id}
            />
          )}
        </div>
      </fieldset>

      {/* Botones de Acción */}
      {canEdit && (
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
      )}
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
        <label>Título de anuncio (opcional - si no hay imagen)</label>
        <input type="text" value={content.overlayTitle || ''} onChange={(e) => onChange('overlayTitle', e.target.value)} placeholder="Ej: INFO DESTACADA" />
      </div>

      <div className="field">
        <label>Texto superpuesto (overlay)</label>
        <textarea value={content.overlayText || ''} onChange={(e) => onChange('overlayText', e.target.value)} placeholder="Opcional: texto sobre la imagen o contenido de anuncio" />
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
function ScoreboardEditor({ content, updateModuleContent, moduleId, onOpenLibrary }) {
  const { worldCupTeams = [] } = useCMS();

  const update = (team, field, value) => {
    updateModuleContent(moduleId, {
      [team]: { ...content[team], [field]: field === 'score' ? (parseInt(value) || 0) : value },
    });
  };

  const handleSelectTeam = (teamKey, teamName) => {
    if (!teamName) return;
    const teamObj = worldCupTeams.find(t => t.name === teamName);
    if (teamObj) {
      updateModuleContent(moduleId, {
        [teamKey]: {
          ...content[teamKey],
          name: teamObj.name.toUpperCase(),
          code: teamObj.code.toUpperCase(),
          flag: teamObj.flag
        }
      });
    }
  };

  return (
    <>
      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Selección Rápida de Equipo A</label>
          <select
            value=""
            onChange={(e) => handleSelectTeam('teamA', e.target.value)}
          >
            <option value="">-- Seleccionar Equipo A --</option>
            {worldCupTeams.map((team) => (
              <option key={`a-${team.name}`} value={team.name}>
                {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name} ({team.code})
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Selección Rápida de Equipo B</label>
          <select
            value=""
            onChange={(e) => handleSelectTeam('teamB', e.target.value)}
          >
            <option value="">-- Seleccionar Equipo B --</option>
            {worldCupTeams.map((team) => (
              <option key={`b-${team.name}`} value={team.name}>
                {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name} ({team.code})
              </option>
            ))}
          </select>
        </div>
      </div>

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
          <label>Equipo A — Bandera (emoji o imagen)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={content.teamA.flag} 
              onChange={(e) => update('teamA', 'flag', e.target.value)} 
              placeholder="Emoji o URL de imagen"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onOpenLibrary((url) => {
                  update('teamA', 'flag', url);
                });
              }}
            >
              🖼️ Elegir
            </button>
          </div>
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
          <label>Equipo B — Bandera (emoji o imagen)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={content.teamB.flag} 
              onChange={(e) => update('teamB', 'flag', e.target.value)} 
              placeholder="Emoji o URL de imagen"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onOpenLibrary((url) => {
                  update('teamB', 'flag', url);
                });
              }}
            >
              🖼️ Elegir
            </button>
          </div>
        </div>
      </div>

      <div className="field">
        <label>Estado del partido</label>
        <input type="text" value={content.status || ''} onChange={(e) => updateModuleContent(moduleId, { status: e.target.value })} />
      </div>
    </>
  );
}

/* ─── Apuesta Editor ─── */
function ApuestaEditor({ content, onChange, updateModuleContent, moduleId, onOpenLibrary }) {
  const { worldCupTeams = [] } = useCMS();

  const updateTeam = (team, field, value) => {
    const existing = content[team] || {};
    updateModuleContent(moduleId, {
      [team]: { ...existing, [field]: value },
    });
  };

  const handleSelectTeam = (teamKey, teamName) => {
    if (!teamName) return;
    const teamObj = worldCupTeams.find(t => t.name === teamName);
    if (teamObj) {
      const existing = content[teamKey] || {};
      updateModuleContent(moduleId, {
        [teamKey]: {
          ...existing,
          name: teamObj.name,
          flag: teamObj.flag
        }
      });
    }
  };

  return (
    <>
      <div className="field-row-3">
        <div className="field">
          <label>Estructura de Apuesta</label>
          <select
            value={content.mode || '3-way'}
            onChange={(e) => onChange('mode', e.target.value)}
          >
            <option value="3-way">3 Opciones (Local / Empate / Visitante)</option>
            <option value="2-way">2 Opciones (Local / Visitante)</option>
            <option value="1-way">1 Opción (Ganador Único / Jugador)</option>
          </select>
        </div>
        <div className="field">
          <label>Título (ej: ¡MÁXIMA GANANCIA CON MÉXICO!)</label>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Etiqueta / Tipo (ej: Primer gol)</label>
          <input
            type="text"
            value={content.tag || ''}
            onChange={(e) => onChange('tag', e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ marginTop: '12px', marginBottom: '8px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', color: 'var(--color-white)' }}>
          <input
            type="checkbox"
            checked={content.showFlags !== false}
            onChange={(e) => onChange('showFlags', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }}
          />
          Mostrar bandera / foto / emoji de los equipos
        </label>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      {/* Team A quick select and details */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {content.mode === '1-way' ? 'Opción Única (Jugador / Equipo)' : 'Opción A (Local)'}
      </h3>
      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Selección Rápida</label>
          <select
            value=""
            onChange={(e) => handleSelectTeam('teamA', e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {worldCupTeams.map((team) => (
              <option key={`ap-a-${team.name}`} value={team.name}>
                {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Nombre</label>
          <input
            type="text"
            value={content.teamA?.name || ''}
            onChange={(e) => updateTeam('teamA', 'name', e.target.value)}
            placeholder={content.mode === '1-way' ? 'Nombre del jugador o equipo' : 'Nombre del equipo'}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Cuota (ej: 1,46)</label>
          <input
            type="text"
            value={content.teamA?.odd || ''}
            onChange={(e) => updateTeam('teamA', 'odd', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Bandera / Foto (emoji o imagen)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={content.teamA?.flag || ''} 
              onChange={(e) => updateTeam('teamA', 'flag', e.target.value)} 
              placeholder="Emoji o URL de imagen"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onOpenLibrary((url) => {
                  updateTeam('teamA', 'flag', url);
                });
              }}
            >
              🖼️ Elegir
            </button>
          </div>
        </div>
      </div>

      {/* Draw info - only show if mode is 3-way */}
      {(content.mode === '3-way' || !content.mode) && (
        <>
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
          <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Opción de Empate
          </h3>
          <div className="field-row">
            <div className="field">
              <label>Cuota de Empate (ej: 4,25)</label>
              <input
                type="text"
                value={content.draw?.odd || ''}
                onChange={(e) => updateModuleContent(moduleId, { draw: { ...content.draw, odd: e.target.value } })}
              />
            </div>
          </div>
        </>
      )}

      {/* Team B quick select and details - only show if mode is 3-way or 2-way */}
      {(content.mode === '3-way' || content.mode === '2-way' || !content.mode) && (
        <>
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
          <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Opción B (Visitante)
          </h3>
          <div className="field-row" style={{ marginBottom: '16px' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Selección Rápida de Equipo B</label>
              <select
                value=""
                onChange={(e) => handleSelectTeam('teamB', e.target.value)}
              >
                <option value="">-- Seleccionar Equipo B --</option>
                {worldCupTeams.map((team) => (
                  <option key={`ap-b-${team.name}`} value={team.name}>
                    {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Equipo B — Nombre</label>
              <input
                type="text"
                value={content.teamB?.name || ''}
                onChange={(e) => updateTeam('teamB', 'name', e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Equipo B — Cuota (ej: 6,66)</label>
              <input
                type="text"
                value={content.teamB?.odd || ''}
                onChange={(e) => updateTeam('teamB', 'odd', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Equipo B — Bandera (emoji o imagen)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={content.teamB?.flag || ''} 
                  onChange={(e) => updateTeam('teamB', 'flag', e.target.value)} 
                  placeholder="Emoji o URL de imagen"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    onOpenLibrary((url) => {
                      updateTeam('teamB', 'flag', url);
                    });
                  }}
                >
                  🖼️ Elegir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Pregunta Editor ─── */
function PreguntaEditor({ content, onChange, updateModuleContent, moduleId }) {
  return (
    <>
      <div className="field">
        <label>Pregunta / Título (ej: ¿AMBOS EQUIPOS ANOTARÁN?)</label>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      <div className="field-row">
        <div className="field">
          <label>Cuota para "SÍ" (ej: 1,85)</label>
          <input
            type="text"
            value={content.yesOdd || ''}
            onChange={(e) => onChange('yesOdd', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Cuota para "NO" (ej: 1,95)</label>
          <input
            type="text"
            value={content.noOdd || ''}
            onChange={(e) => onChange('noOdd', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

/* ─── Results Editor ─── */
function ResultsEditor({ content, updateModuleContent, moduleId, onOpenLibrary }) {
  const { worldCupTeams = [] } = useCMS();

  const updateMatch = (idx, field, value) => {
    const updated = [...(content.matches || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    updateModuleContent(moduleId, { matches: updated });
  };

  const addMatch = () => {
    updateModuleContent(moduleId, {
      matches: [...(content.matches || []), { teamA: 'EQUIPO A', teamB: 'EQUIPO B', scoreA: 0, scoreB: 0, flagA: '', flagB: '' }],
    });
  };

  const removeMatch = (idx) => {
    updateModuleContent(moduleId, {
      matches: content.matches.filter((_, i) => i !== idx),
    });
  };

  const handleSelectTeam = (idx, teamKey, teamName) => {
    if (!teamName) return;
    const teamObj = worldCupTeams.find(t => t.name === teamName);
    if (teamObj) {
      const updated = [...(content.matches || [])];
      updated[idx] = {
        ...updated[idx],
        [teamKey]: teamObj.name.toUpperCase(),
        [teamKey === 'teamA' ? 'flagA' : 'flagB']: teamObj.flag
      };
      updateModuleContent(moduleId, { matches: updated });
    }
  };

  return (
    <>
      {(content.matches || []).map((match, i) => (
        <div className="match-editor-box" key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-gold)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Partido #{i + 1}</span>
            <button type="button" className="admin-btn-icon danger" onClick={() => removeMatch(i)} style={{ height: '24px', width: '24px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          
          <div className="field-row" style={{ marginBottom: '8px' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Sel. Rápida Equipo A</label>
              <select
                value=""
                onChange={(e) => handleSelectTeam(i, 'teamA', e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="">-- Seleccionar Equipo A --</option>
                {worldCupTeams.map((team) => (
                  <option key={`match-sel-a-${team.name}`} value={team.name}>
                    {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Sel. Rápida Equipo B</label>
              <select
                value=""
                onChange={(e) => handleSelectTeam(i, 'teamB', e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="">-- Seleccionar Equipo B --</option>
                {worldCupTeams.map((team) => (
                  <option key={`match-sel-b-${team.name}`} value={team.name}>
                    {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Equipo A — Nombre</label>
              <input type="text" value={match.teamA} onChange={(e) => updateMatch(i, 'teamA', e.target.value)} />
            </div>
            <div className="field">
              <label>Equipo B — Nombre</label>
              <input type="text" value={match.teamB} onChange={(e) => updateMatch(i, 'teamB', e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Equipo A — Goles</label>
              <input type="text" value={match.scoreA} onChange={(e) => updateMatch(i, 'scoreA', e.target.value)} />
            </div>
            <div className="field">
              <label>Equipo B — Goles</label>
              <input type="text" value={match.scoreB} onChange={(e) => updateMatch(i, 'scoreB', e.target.value)} />
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 0 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Equipo A — Bandera (emoji o imagen)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={match.flagA || ''} 
                  onChange={(e) => updateMatch(i, 'flagA', e.target.value)} 
                  placeholder="Emoji o URL de imagen"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    onOpenLibrary((url) => {
                      updateMatch(i, 'flagA', url);
                    });
                  }}
                >
                  🖼️
                </button>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Equipo B — Bandera (emoji o imagen)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={match.flagB || ''} 
                  onChange={(e) => updateMatch(i, 'flagB', e.target.value)} 
                  placeholder="Emoji o URL de imagen"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    onOpenLibrary((url) => {
                      updateMatch(i, 'flagB', url);
                    });
                  }}
                >
                  🖼️
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="add-module-btn" onClick={addMatch}>+ Agregar partido</button>
    </>
  );
}

/* ─── Upcoming Editor ─── */
function UpcomingEditor({ content, onChange, updateModuleContent, moduleId, onOpenLibrary }) {
  const { worldCupTeams = [] } = useCMS();

  const handleSelectTeam = (teamKey, teamName) => {
    if (!teamName) return;
    const teamObj = worldCupTeams.find(t => t.name === teamName);
    if (teamObj) {
      updateModuleContent(moduleId, {
        [teamKey]: teamObj.name.toUpperCase(),
        [teamKey === 'teamA' ? 'flagA' : 'flagB']: teamObj.flag
      });
    }
  };

  return (
    <>
      <div className="field">
        <label>Etiqueta</label>
        <input type="text" value={content.label || ''} onChange={(e) => onChange('label', e.target.value)} />
      </div>
      <div className="field">
        <label>Hora</label>
        <input type="text" value={content.time || ''} onChange={(e) => onChange('time', e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Sel. Rápida Equipo A</label>
          <select
            value=""
            onChange={(e) => handleSelectTeam('teamA', e.target.value)}
            style={{ marginBottom: '6px', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="">-- Seleccionar Equipo A --</option>
            {worldCupTeams.map((team) => (
              <option key={`upcoming-sel-a-${team.name}`} value={team.name}>
                {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
              </option>
            ))}
          </select>
          <label>Equipo A — Nombre</label>
          <input type="text" value={content.teamA || ''} onChange={(e) => onChange('teamA', e.target.value)} />
          
          <label style={{ marginTop: '6px' }}>Equipo A — Bandera (emoji o imagen)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={content.flagA || ''} 
              onChange={(e) => onChange('flagA', e.target.value)} 
              placeholder="Emoji o URL de imagen"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onOpenLibrary((url) => {
                  onChange('flagA', url);
                });
              }}
            >
              🖼️
            </button>
          </div>
        </div>

        <div className="field">
          <label>Sel. Rápida Equipo B</label>
          <select
            value=""
            onChange={(e) => handleSelectTeam('teamB', e.target.value)}
            style={{ marginBottom: '6px', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="">-- Seleccionar Equipo B --</option>
            {worldCupTeams.map((team) => (
              <option key={`upcoming-sel-b-${team.name}`} value={team.name}>
                {team.flag.startsWith('/') || team.flag.startsWith('http') || team.flag.includes('.') ? '🖼️' : team.flag} {team.name}
              </option>
            ))}
          </select>
          <label>Equipo B — Nombre</label>
          <input type="text" value={content.teamB || ''} onChange={(e) => onChange('teamB', e.target.value)} />
          
          <label style={{ marginTop: '6px' }}>Equipo B — Bandera (emoji o imagen)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={content.flagB || ''} 
              onChange={(e) => onChange('flagB', e.target.value)} 
              placeholder="Emoji o URL de imagen"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onOpenLibrary((url) => {
                  onChange('flagB', url);
                });
              }}
            >
              🖼️
            </button>
          </div>
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
                if (mod.type === 'ticker') return '80px';
                const isBrand = mod.id === 'default_brand' || (mod.type === 'media' && mod.label?.toLowerCase().includes('logo'));
                if (isBrand) return '80px';
                
                let baseWeight = 1.5;
                if (mod.type === 'media') baseWeight = 2.5;
                else if (mod.type === 'scoreboard') baseWeight = 1.8;
                else if (mod.type === 'upcoming') baseWeight = 1.5;
                else if (mod.type === 'results') baseWeight = 1.8;
                else if (mod.type === 'news') baseWeight = 1.8;
                
                return `${baseWeight / (mod.gridPosition?.rowSpan || 1)}fr`;
              }).join(' ')
            : Array.from({ length: layout.grid.rows }).map((_, i) => 
                layout.modules.some(m => m.type === 'ticker' && (m.gridPosition?.row || 1) === i + 1) ? '80px' : '1fr'
              ).join(' '),
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

const compareConfigs = (before, after) => {
  const changes = [];
  if (!after) {
    return changes;
  }
  if (!before) {
    changes.push("✨ Configuración inicial creada.");
    return changes;
  }

  if (before.orientation !== after.orientation) {
    changes.push(`📐 Orientación de pantalla cambiada de "${before.orientation || 'horizontal'}" a "${after.orientation || 'horizontal'}"`);
  }

  const beforeGrid = before.grid || { cols: 5, rows: 5 };
  const afterGrid = after.grid || { cols: 5, rows: 5 };
  if (beforeGrid.cols !== afterGrid.cols || beforeGrid.rows !== afterGrid.rows) {
    changes.push(`🔲 Dimensiones de cuadrícula cambiadas de ${beforeGrid.cols}x${beforeGrid.rows} a ${afterGrid.cols}x${afterGrid.rows}`);
  }

  const beforeModules = before.modules || [];
  const afterModules = after.modules || [];

  const beforeMap = new Map(beforeModules.map(m => [m.id, m]));
  const afterMap = new Map(afterModules.map(m => [m.id, m]));

  // Modificados y Agregados
  for (const mod of afterModules) {
    if (!beforeMap.has(mod.id)) {
      changes.push(`➕ Agregado: módulo "${mod.label}" (${MODULE_TYPES[mod.type]?.label || mod.type})`);
    } else {
      const oldMod = beforeMap.get(mod.id);
      const modDiffs = [];
      
      if (oldMod.label !== mod.label) {
        modDiffs.push(`nombre cambiado de "${oldMod.label}" a "${mod.label}"`);
      }
      if (oldMod.visible !== mod.visible) {
        modDiffs.push(`visibilidad cambiada a ${mod.visible === false ? 'Oculto' : 'Visible'}`);
      }
      
      const oldGP = oldMod.gridPosition || {};
      const newGP = mod.gridPosition || {};
      if (oldGP.col !== newGP.col || oldGP.row !== newGP.row || oldGP.colSpan !== newGP.colSpan || oldGP.rowSpan !== newGP.rowSpan) {
        modDiffs.push(`posición reajustada`);
      }

      if (JSON.stringify(oldMod.content) !== JSON.stringify(mod.content)) {
        modDiffs.push(`contenido editado`);
      }

      if (modDiffs.length > 0) {
        changes.push(`✏️ Modificado: módulo "${mod.label}" (${MODULE_TYPES[mod.type]?.label || mod.type}) - [${modDiffs.join(', ')}]`);
      }
    }
  }

  // Eliminados
  for (const mod of beforeModules) {
    if (!afterMap.has(mod.id)) {
      changes.push(`🗑️ Eliminado: módulo "${mod.label}" (${MODULE_TYPES[mod.type]?.label || mod.type})`);
    }
  }

  return changes;
};

/* ═══════════════════════════════════════════
   LAYOUT PREVIEW — Interactive blueprint builder
   ═══════════════════════════════════════════ */
function LayoutPreview({ modules, grid, selectedId, onSelect, updateModule, removeModule, hasPermission }) {
  const { liveData, draftData, currentUser, hasPendingChanges, activeLayout } = useCMS();
  const canApprove = currentUser?.username === 'admin' || currentUser?.allowedTypes?.includes('approve');
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
  
                  const cellBg = isSelected 
                    ? 'rgba(212, 168, 67, 0.12)' 
                    : (mod.content?.moduleBgTransparent === true ? 'rgba(22,22,22,0.85)' : (mod.content?.moduleBgColor || mod.content?.cardBgColor || '#0a0a0a'));

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

/* ═══════════════════════════════════════════
   ADMIN PANEL — Full screen CMS
   ═══════════════════════════════════════════ */
export default function AdminPanel() {
  const { draftData, liveData, currentUser, login, logout, role, setRole, users, createEditor, deleteEditor, hasPermission, hasPendingChanges, approveAndPublish, discardDraft, addModule, removeModule, updateModule, updateModuleContent, moveModule, updateGrid, updateOrientation, resetAll, templates, createTemplate, applyTemplate, deleteTemplate, history, fetchHistory, activeLayout, switchLayout } = useCMS();
  const canApprove = currentUser?.username === 'admin' || currentUser?.allowedTypes?.includes('approve');
  const isReadOnlyUser = currentUser?.allowedTypes?.includes('readonly_media_add');
  const [selectedId, setSelectedId] = useState(draftData.modules[0]?.id || null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Estados para los botones desplegables de previsualización
  const [liveDropdownOpen, setLiveDropdownOpen] = useState(false);
  const [draftDropdownOpen, setDraftDropdownOpen] = useState(false);
  const liveDropdownRef = useRef(null);
  const draftDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (liveDropdownRef.current && !liveDropdownRef.current.contains(event.target)) {
        setLiveDropdownOpen(false);
      }
      if (draftDropdownRef.current && !draftDropdownRef.current.contains(event.target)) {
        setDraftDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Estados para la Biblioteca de Medios
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaSelectCallback, setMediaSelectCallback] = useState(null);

  // Modo de vista: 'modules' (diseño de cuadrícula) o 'editors' (gestión de roles de editores)
  const [viewMode, setViewMode] = useState('modules');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Por favor ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    setLoginError('');
    const result = await login(username.trim(), password.trim());
    setLoading(false);
    if (!result.success) {
      setLoginError(result.error);
    }
  };

  const selectedModule = draftData.modules.find((m) => m.id === selectedId);

  const handleAddModule = useCallback((type) => {
    if (isReadOnlyUser) return;
    const newId = addModule(type);
    setSelectedId(newId);
    setShowAddMenu(false);
  }, [addModule, isReadOnlyUser]);

  const handleRemove = useCallback((id) => {
    if (isReadOnlyUser) return;
    if (!window.confirm('¿Eliminar este módulo?')) return;
    removeModule(id);
    setSelectedId(draftData.modules.find((m) => m.id !== id)?.id || null);
  }, [removeModule, draftData.modules, isReadOnlyUser]);

  const openMediaLibraryForSelection = useCallback((callback) => {
    setMediaSelectCallback(() => callback);
    setMediaModalOpen(true);
  }, []);

  useEffect(() => {
    if (viewMode === 'editors' && currentUser?.username !== 'admin') {
      setViewMode('modules');
    }
    if (viewMode === 'history' && !canApprove) {
      setViewMode('modules');
    }
  }, [viewMode, currentUser, canApprove]);

  if (!currentUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, var(--color-bg-card) 0%, var(--color-bg-primary) 100%)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-white)',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(26, 26, 26, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Logo / Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              color: 'var(--color-gold)',
              marginBottom: '12px',
              textShadow: '0 0 10px rgba(212, 168, 67, 0.3)'
            }}>♣</div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              margin: 0,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Billboard <span style={{ color: 'var(--color-gold)' }}>CMS</span>
            </h1>
            <p style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginTop: '8px',
              marginRight: 0,
              marginLeft: 0,
              marginBottom: 0
            }}>Ingresa tus credenciales para acceder al panel</p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loginError && (
              <div style={{
                background: 'rgba(239, 83, 80, 0.1)',
                border: '1px solid rgba(239, 83, 80, 0.3)',
                color: '#ef5350',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>❌</span>
                <span>{loginError}</span>
              </div>
            )}

            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ej. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
                disabled={loading}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
              disabled={loading}
            >
              {loading ? 'Iniciando Sesión...' : '🔑 Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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

        {/* Active Layout Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border)', padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>EDITANDO PANTALLA:</span>
          <select
            value={activeLayout}
            onChange={(e) => switchLayout(e.target.value)}
            style={{
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-white)',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-body)'
            }}
          >
            <option value="12x6">🖥️ Pantalla 12x6 Mts (2:1)</option>
            <option value="9x9">⬛ Pantalla 9x9 Mts (1:1)</option>
          </select>
        </div>

        <div className="admin-header-actions" style={{ marginLeft: 'auto' }}>
          {canApprove && (
            <button
              className={`admin-btn admin-btn-sm ${viewMode === 'history' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setViewMode(prev => prev === 'history' ? 'modules' : 'history')}
              style={{ marginRight: '8px', gap: '6px' }}
            >
              📜 {viewMode === 'history' ? 'Ver Módulos' : 'Historial de Cambios'}
            </button>
          )}
          {currentUser.username === 'admin' && (
            <button
              className={`admin-btn admin-btn-sm ${viewMode === 'editors' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setViewMode(prev => prev === 'editors' ? 'modules' : 'editors')}
              style={{ marginRight: '8px', gap: '6px' }}
            >
              👥 {viewMode === 'editors' ? 'Ver Módulos' : 'Gestionar Editores'}
            </button>
          )}

          <button
            className={`admin-btn admin-btn-sm ${viewMode === 'templates' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setViewMode(prev => prev === 'templates' ? 'modules' : 'templates')}
            style={{ marginRight: '8px', gap: '6px' }}
          >
            📋 {viewMode === 'templates' ? 'Ver Módulos' : 'Plantillas'}
          </button>

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

          {/* Botón Desplegable: En Vivo */}
          <div ref={liveDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => {
                setLiveDropdownOpen(!liveDropdownOpen);
                setDraftDropdownOpen(false);
              }}
              style={{ gap: '6px' }}
            >
              👁️ En Vivo <span style={{ fontSize: '9px', opacity: 0.8 }}>▼</span>
            </button>
            {liveDropdownOpen && (
              <div className="admin-dropdown-menu">
                <Link to="/" className="admin-dropdown-item" target="_blank" onClick={() => setLiveDropdownOpen(false)}>
                  👁️ Ver Valla (16:9)
                </Link>
                <Link to="/?screen=12x6" className="admin-dropdown-item" target="_blank" onClick={() => setLiveDropdownOpen(false)}>
                  🖥️ Valla 12x6 (2:1)
                </Link>
                <Link to="/?screen=9x9" className="admin-dropdown-item" target="_blank" onClick={() => setLiveDropdownOpen(false)}>
                  ⬛ Valla 9x9 (1:1)
                </Link>
              </div>
            )}
          </div>

          <span style={{ borderLeft: '1px solid var(--color-border)', height: '20px', margin: '0 8px' }} />

          {/* Botón Desplegable: Visualizar Borrador */}
          <div ref={draftDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-draft-trigger"
              onClick={() => {
                setDraftDropdownOpen(!draftDropdownOpen);
                setLiveDropdownOpen(false);
              }}
              style={{ gap: '6px' }}
            >
              📝 Visualizar Borrador <span style={{ fontSize: '9px', opacity: 0.8 }}>▼</span>
            </button>
            {draftDropdownOpen && (
              <div className="admin-dropdown-menu">
                <Link to="/?draft=true" className="admin-dropdown-item admin-dropdown-item-draft" target="_blank" onClick={() => setDraftDropdownOpen(false)}>
                  📝 Ver Borrador (16:9)
                </Link>
                <Link to="/?draft=true&screen=12x6" className="admin-dropdown-item admin-dropdown-item-draft" target="_blank" onClick={() => setDraftDropdownOpen(false)}>
                  📝 Borrador 12x6 (2:1)
                </Link>
                <Link to="/?draft=true&screen=9x9" className="admin-dropdown-item admin-dropdown-item-draft" target="_blank" onClick={() => setDraftDropdownOpen(false)}>
                  📝 Borrador 9x9 (1:1)
                </Link>
              </div>
            )}
          </div>

          <span style={{ borderLeft: '1px solid var(--color-border)', height: '20px', margin: '0 8px' }} />

          {/* Logged in User Indicator & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border)', padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '14px' }}>👤</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{currentUser.name}</span>
            <span style={{ fontSize: '10px', background: 'rgba(212, 168, 67, 0.15)', color: 'var(--color-gold)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {currentUser.username === 'admin' ? 'Admin' : 'Editor'}
            </span>
            <button 
              type="button" 
              onClick={logout} 
              className="admin-btn admin-btn-sm" 
              style={{ background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', color: '#ef5350', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)' }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'editors' ? (
        <div className="admin-editors-fullpage" style={{ gridColumn: '1 / -1', gridRow: '2', padding: '40px', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
          <EditorsManagement />
        </div>
      ) : viewMode === 'templates' ? (
        <div className="admin-editors-fullpage" style={{ gridColumn: '1 / -1', gridRow: '2', padding: '40px', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
          <TemplatesManagement setViewMode={setViewMode} />
        </div>
      ) : viewMode === 'history' ? (
        <div className="admin-editors-fullpage" style={{ gridColumn: '1 / -1', gridRow: '2', padding: '40px', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
          <HistoryManagement setViewMode={setViewMode} />
        </div>
      ) : (
        <>
          {/* ─── Sidebar — Module List ─── */}
          <div className="admin-sidebar">
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-title">Módulos</div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{draftData.modules.length}</span>
            </div>

            {/* Control del Tamaño de la Cuadrícula */}
            <div className="grid-size-selector">
              <div className="grid-size-selector-title">Cuadrícula</div>
              <div className="grid-size-selector-inputs">
                <div className="grid-size-field">
                  <label>Columnas (Cols)</label>
                  <select
                    value={draftData.grid.cols}
                    onChange={(e) => updateGrid({ cols: parseInt(e.target.value) || 1 })}
                    disabled={isReadOnlyUser}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="grid-size-field">
                  <label>Filas (Rows)</label>
                  <select
                    value={draftData.grid.rows}
                    onChange={(e) => updateGrid({ rows: parseInt(e.target.value) || 1 })}
                    disabled={isReadOnlyUser}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-sidebar-list">
              {draftData.modules.map((mod, idx) => {
                const isHidden = mod.visible === false;
                const canEdit = hasPermission(mod.type);
                return (
                  <div
                    key={mod.id}
                    className={`module-list-item ${selectedId === mod.id ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                    onClick={() => setSelectedId(mod.id)}
                    style={{ opacity: canEdit ? 1 : 0.7 }}
                  >
                    <span className="module-list-icon">{MODULE_TYPES[mod.type]?.icon}</span>
                    <div className="module-list-info">
                      <div className="module-list-label">
                        {mod.label} {!canEdit && <span style={{ marginLeft: 6, fontSize: 11 }}>🔒</span>}
                      </div>
                      <div className="module-list-type">
                        {MODULE_TYPES[mod.type]?.label} {isHidden && '(Oculto)'}
                      </div>
                    </div>
                    <div className="module-list-actions">
                      <button
                        className={`module-list-action-btn ${isHidden ? '' : 'active-visible'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canEdit) updateModule(mod.id, { visible: isHidden });
                        }}
                        title={isHidden ? "Mostrar en la valla" : "Ocultar en la valla"}
                        disabled={!canEdit}
                        style={{ opacity: canEdit ? 1 : 0.3, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                      >
                        {isHidden ? '👁️' : '🕶️'}
                      </button>
                      <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'up'); }} title="Mover arriba" disabled={idx === 0 || !canEdit} style={{ opacity: canEdit ? 1 : 0.3, cursor: canEdit ? 'pointer' : 'not-allowed' }}>↑</button>
                      <button className="module-list-action-btn" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'down'); }} title="Mover abajo" disabled={idx === draftData.modules.length - 1 || !canEdit} style={{ opacity: canEdit ? 1 : 0.3, cursor: canEdit ? 'pointer' : 'not-allowed' }}>↓</button>
                      <button className="module-list-action-btn danger" onClick={(e) => { e.stopPropagation(); if (canEdit) handleRemove(mod.id); }} title="Eliminar" disabled={!canEdit} style={{ opacity: canEdit ? 1 : 0.3, cursor: canEdit ? 'pointer' : 'not-allowed' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-sidebar-footer">
              {showAddMenu ? (
                <div className="add-module-menu">
                  {Object.entries(MODULE_TYPES).filter(([key]) => hasPermission(key)).length === 0 ? (
                    <div style={{ padding: 12, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      No tienes permisos para agregar módulos.
                    </div>
                  ) : (
                    Object.entries(MODULE_TYPES)
                      .filter(([key]) => hasPermission(key))
                      .map(([key, type]) => (
                        <button key={key} className="add-module-option" onClick={() => handleAddModule(key)}>
                          <span className="add-module-option-icon">{type.icon}</span>
                          <div>
                            <div className="add-module-option-label">{type.label}</div>
                            <div className="add-module-option-desc">{type.description}</div>
                          </div>
                        </button>
                      ))
                  )}
                  <button className="add-module-btn" style={{ marginTop: 8 }} onClick={() => setShowAddMenu(false)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                !isReadOnlyUser && (
                  <button className="add-module-btn" onClick={() => setShowAddMenu(true)}>
                    + Agregar Módulo
                  </button>
                )
              )}
            </div>
          </div>

          {/* ─── Main Content — Editor ─── */}
          <div className="admin-main">
            {/* Barra de Flujo de Trabajo / Aprobación */}
            {((!canApprove) || (canApprove && hasPendingChanges)) && (
              <div className="workflow-status-bar" style={{
                background: hasPendingChanges ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--color-border)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {hasPendingChanges && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✍️</span>
                        <span>Modificado por: <strong style={{ color: 'var(--color-gold)' }}>{draftData.lastModifiedBy || 'Desconocido'}</strong> (Pendiente de aprobación)</span>
                      </div>
                      {/* List of changes */}
                      <div style={{ maxHeight: '90px', overflowY: 'auto', fontSize: '11px', background: 'rgba(0, 0, 0, 0.25)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', minWidth: '320px' }}>
                        <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {compareConfigs(liveData, draftData).map((diff, i) => (
                            <li key={i} style={{ lineHeight: '1.3' }}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!canApprove && !isReadOnlyUser && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      style={{ gap: '6px' }}
                      onClick={() => {
                        alert('Borrador guardado correctamente. Los cambios están listos para ser aprobados por un Administrador o Aprobador.');
                      }}
                    >
                      💾 Guardar Borrador
                    </button>
                  )}

                  {canApprove && hasPendingChanges && (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ background: 'var(--color-success)', color: 'var(--color-white)', gap: '6px' }}
                        onClick={() => {
                          approveAndPublish();
                          alert('¡Excelente! Los cambios en borrador han sido aprobados y publicados a la valla en vivo.');
                        }}
                      >
                        ✓ Aprobar y Publicar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        style={{ gap: '6px' }}
                        onClick={() => {
                          if (window.confirm('¿Seguro que deseas descartar todos los cambios pendientes en borrador y volver al último estado público?')) {
                            discardDraft();
                          }
                        }}
                      >
                        ✕ Descartar Cambios
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="admin-main-content-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {selectedModule ? (
                <>
                  <div className="layout-preview-wrapper">
                    <LayoutPreview
                      modules={draftData.modules}
                      grid={draftData.grid}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      updateModule={updateModule}
                      removeModule={handleRemove}
                      hasPermission={hasPermission}
                    />
                  </div>
                  <ModuleEditor
                    key={selectedModule.id}
                    module={selectedModule}
                    updateModule={updateModule}
                    updateModuleContent={updateModuleContent}
                    removeModule={handleRemove}
                    onOpenLibrary={openMediaLibraryForSelection}
                    canEdit={hasPermission(selectedModule.type)}
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
        </>
      )}

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

/* ═══════════════════════════════════════════
   EDITORS MANAGEMENT — Editor Roles Dashboard
   ═══════════════════════════════════════════ */
function EditorsManagement() {
  const { users, createEditor, deleteEditor, currentUser } = useCMS();
  const [name, setName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]); // List of module type keys allowed
  const [allSelected, setAllSelected] = useState(false);
  const [canApprovePermission, setCanApprovePermission] = useState(false);
  const [canDeleteMediaPermission, setCanDeleteMediaPermission] = useState(false);
  const [readonlyMediaAddSelected, setReadonlyMediaAddSelected] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const [editingUsername, setEditingUsername] = useState(null);

  const handleEditClick = (u) => {
    setEditingUsername(u.username);
    setName(u.name);
    setUsernameInput(u.username);
    setPasswordInput(''); // Deja vacío para conservar la clave actual
    
    const hasAll = u.allowedTypes.includes('*');
    setAllSelected(hasAll);
    setCanApprovePermission(u.allowedTypes.includes('approve'));
    setCanDeleteMediaPermission(u.allowedTypes.includes('delete_media'));
    setReadonlyMediaAddSelected(u.allowedTypes.includes('readonly_media_add'));
    setSelectedTypes(u.allowedTypes.filter(t => t !== 'approve' && t !== 'delete_media' && t !== '*' && t !== 'readonly_media_add'));
  };

  const handleCancelEdit = () => {
    setEditingUsername(null);
    setName('');
    setUsernameInput('');
    setPasswordInput('');
    setSelectedTypes([]);
    setAllSelected(false);
    setCanApprovePermission(false);
    setCanDeleteMediaPermission(false);
    setReadonlyMediaAddSelected(false);
    setFeedback(null);
  };

  const handleToggleType = (typeKey) => {
    setReadonlyMediaAddSelected(false); // Desactiva solo lectura si selecciona un tipo individual
    if (typeKey === '*') {
      if (allSelected) {
        setSelectedTypes([]);
        setAllSelected(false);
      } else {
        setSelectedTypes(['*']);
        setAllSelected(true);
      }
    } else {
      setAllSelected(false);
      setSelectedTypes((prev) => {
        // If it was '*', clear it first
        const cleaned = prev.filter(t => t !== '*');
        if (cleaned.includes(typeKey)) {
          return cleaned.filter((t) => t !== typeKey);
        } else {
          return [...cleaned, typeKey];
        }
      });
    }
  };

  useEffect(() => {
    // If all individual types are selected, toggle allSelected
    const individualTypes = Object.keys(MODULE_TYPES);
    const hasAllIndividual = individualTypes.every(t => selectedTypes.includes(t));
    if (hasAllIndividual && !allSelected) {
      setAllSelected(true);
      setSelectedTypes(['*']);
    }
  }, [selectedTypes, allSelected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'El nombre completo es requerido.' });
      return;
    }
    if (!usernameInput.trim()) {
      setFeedback({ type: 'error', message: 'El nombre de usuario (login) es requerido.' });
      return;
    }
    if (!editingUsername && !passwordInput.trim()) {
      setFeedback({ type: 'error', message: 'La contraseña es requerida.' });
      return;
    }
    const finalTypes = allSelected ? ['*'] : selectedTypes;
    if (finalTypes.length === 0 && !canApprovePermission && !canDeleteMediaPermission && !readonlyMediaAddSelected) {
      setFeedback({ type: 'error', message: 'Debes seleccionar al menos un permiso, habilitar la aprobación/eliminación o activar el perfil de solo lectura.' });
      return;
    }

    let typesToSend = [];
    if (readonlyMediaAddSelected) {
      typesToSend = ['readonly_media_add'];
    } else {
      typesToSend = [...finalTypes];
      if (canApprovePermission) typesToSend.push('approve');
      if (canDeleteMediaPermission) typesToSend.push('delete_media');
    }

    const success = await createEditor(usernameInput.trim(), passwordInput.trim(), name.trim(), typesToSend);
    if (success) {
      handleCancelEdit();
      setFeedback({ type: 'success', message: editingUsername ? `Usuario "${usernameInput}" actualizado exitosamente.` : `Usuario "${usernameInput}" guardado exitosamente.` });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: editingUsername ? 'No se pudo actualizar el usuario.' : 'No se pudo guardar el usuario.' });
    }
  };

  return (
    <div className="editors-mgmt-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: '32px',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-white)'
    }}>
      {/* List section */}
      <div className="editors-list-panel" style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          letterSpacing: '0.5px',
          color: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          margin: 0,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👥</span> Usuarios Configurados
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '600px', paddingRight: '4px' }}>
          {users.map((u) => {
            const isActive = currentUser.username.toLowerCase() === u.username.toLowerCase();
            const isAll = u.allowedTypes.includes('*');
            return (
              <div key={u.username} style={{
                background: isActive ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isActive ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                transition: 'var(--transition-fast)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>✍️</span>
                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: isActive ? 'var(--color-gold)' : 'var(--color-white)' }}>
                      {u.name} <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)', fontSize: '13px' }}>({u.username})</span>
                    </span>
                    {u.username.toLowerCase() === 'admin' && (
                      <span style={{
                        fontSize: '9px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase'
                      }}>Predeterminado</span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: '9px',
                        background: 'var(--color-gold)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        color: 'var(--color-bg-primary)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>Sesión Activa</span>
                    )}
                  </div>
                  
                  {/* Badges for allowed module types */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.allowedTypes.includes('readonly_media_add') && (
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(239, 83, 80, 0.15)',
                        border: '1px solid rgba(239, 83, 80, 0.3)',
                        color: '#ef5350',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🔒 Solo Lectura + Multimedia (Agregar)
                      </span>
                    )}

                    {u.allowedTypes.includes('approve') && (
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(212, 168, 67, 0.15)',
                        border: '1px solid rgba(212, 168, 67, 0.3)',
                        color: 'var(--color-gold)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✅ Permiso de Aprobación
                      </span>
                    )}

                    {u.allowedTypes.includes('delete_media') && (
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(239, 83, 80, 0.15)',
                        border: '1px solid rgba(239, 83, 80, 0.3)',
                        color: '#ef5350',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🗑️ Eliminar de la Biblioteca
                      </span>
                    )}

                    {isAll ? (
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(56, 161, 105, 0.15)',
                        border: '1px solid rgba(56, 161, 105, 0.3)',
                        color: '#48bb78',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🟢 Acceso Completo (Todos los módulos)
                      </span>
                    ) : (
                      Object.entries(MODULE_TYPES).map(([typeKey, typeInfo]) => {
                        const hasPerm = u.allowedTypes.includes(typeKey);
                        return (
                          <span key={typeKey} style={{
                            fontSize: '11px',
                            background: hasPerm ? 'rgba(56, 161, 105, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: hasPerm ? '1px solid rgba(56, 161, 105, 0.3)' : '1px solid var(--color-border)',
                            color: hasPerm ? '#48bb78' : 'var(--color-text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: hasPerm ? 1 : 0.4
                          }}>
                            {hasPerm ? '🟢' : '🔒'} {typeInfo.icon} {typeInfo.label}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="admin-btn-icon"
                    title="Editar Usuario"
                    style={{ padding: '8px', cursor: 'pointer', margin: 0, background: 'rgba(212, 168, 67, 0.1)', border: '1px solid rgba(212, 168, 67, 0.3)', color: 'var(--color-gold)', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleEditClick(u)}
                  >
                    ✏️
                  </button>

                  {/* Disable delete for default admin */}
                  {u.username.toLowerCase() !== 'admin' && (
                    <button
                      type="button"
                      className="admin-btn-icon danger"
                      title="Eliminar Perfil"
                      style={{ padding: '8px', cursor: 'pointer', margin: 0 }}
                      onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar al editor "${u.name}" (${u.username})?`)) {
                          deleteEditor(u.username);
                        }
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creation form panel */}
      <form onSubmit={handleSubmit} className="editors-create-panel" style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          letterSpacing: '0.5px',
          color: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          margin: 0,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{editingUsername ? '✏️' : '➕'}</span> {editingUsername ? 'Editar Usuario' : 'Nuevo Usuario / Editor'}
        </h2>

        {feedback && (
          <div style={{
            background: feedback.type === 'success' ? 'rgba(56, 161, 105, 0.12)' : 'rgba(229, 62, 62, 0.12)',
            border: feedback.type === 'success' ? '1px solid rgba(56, 161, 105, 0.3)' : '1px solid rgba(229, 62, 62, 0.3)',
            color: feedback.type === 'success' ? '#48bb78' : '#feb2b2',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{feedback.type === 'success' ? '✅' : '❌'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="field">
          <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
            Nombre Completo
          </label>
          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-white)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none'
            }}
          />
        </div>

        <div className="field">
          <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
            Nombre de Usuario (Login) {editingUsername && <span style={{ textTransform: 'none', fontWeight: 'normal', color: 'var(--color-text-secondary)', fontSize: '11px' }}>(No modificable)</span>}
          </label>
          <input
            type="text"
            placeholder="Ej. juanp"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            disabled={!!editingUsername}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: editingUsername ? 'var(--color-text-secondary)' : 'var(--color-white)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              cursor: editingUsername ? 'not-allowed' : 'text',
              opacity: editingUsername ? 0.7 : 1
            }}
          />
        </div>

        <div className="field">
          <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
            Contraseña {editingUsername && <span style={{ textTransform: 'none', fontWeight: 'normal', color: 'var(--color-gold)', fontSize: '11px' }}>(Opcional, dejar vacío para conservar)</span>}
          </label>
          <input
            type="password"
            placeholder={editingUsername ? "Dejar en blanco para no cambiar" : "Clave de acceso"}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-white)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none'
            }}
          />
        </div>

        <div className="field">
          <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'block', fontWeight: 'bold' }}>
            Asignar Permisos por Módulo
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Special toggle for "All Modules" */}
            <div
              onClick={() => handleToggleType('*')}
              style={{
                background: allSelected ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: allSelected ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-fast)'
              }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {}} // Controlled click on container
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: allSelected ? 'var(--color-gold)' : 'var(--color-white)' }}>
                  👑 Acceso Completo (Super-Editor)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Permite agregar y editar cualquier tipo de módulo en la valla
                </div>
              </div>
            </div>

            {/* Special toggle for "Approval" */}
            <div
              onClick={() => {
                if (!readonlyMediaAddSelected) {
                  setCanApprovePermission(prev => !prev);
                }
              }}
              style={{
                background: canApprovePermission ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: canApprovePermission ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                cursor: readonlyMediaAddSelected ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-fast)',
                opacity: readonlyMediaAddSelected ? 0.6 : 1
              }}
            >
              <input
                type="checkbox"
                checked={canApprovePermission}
                disabled={readonlyMediaAddSelected}
                onChange={() => {}} // Controlled click on container
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)', cursor: readonlyMediaAddSelected ? 'not-allowed' : 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: canApprovePermission ? 'var(--color-gold)' : 'var(--color-white)' }}>
                  ✅ 📑 Habilitar Aprobación y Publicación
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Permite aprobar y publicar cambios pendientes en la valla (Aprobador)
                </div>
              </div>
            </div>

            {/* Special toggle for "Delete Media" */}
            <div
              onClick={() => {
                if (!readonlyMediaAddSelected) {
                  setCanDeleteMediaPermission(prev => !prev);
                }
              }}
              style={{
                background: canDeleteMediaPermission ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: canDeleteMediaPermission ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                cursor: readonlyMediaAddSelected ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-fast)',
                opacity: readonlyMediaAddSelected ? 0.6 : 1
              }}
            >
              <input
                type="checkbox"
                checked={canDeleteMediaPermission}
                disabled={readonlyMediaAddSelected}
                onChange={() => {}} // Controlled click on container
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)', cursor: readonlyMediaAddSelected ? 'not-allowed' : 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: canDeleteMediaPermission ? 'var(--color-gold)' : 'var(--color-white)' }}>
                  🗑️ Habilitar Eliminación de Biblioteca
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Permite eliminar permanentemente archivos de la biblioteca de medios
                </div>
              </div>
            </div>

            {/* Special toggle for "Solo Lectura + Multimedia" */}
            <div
              onClick={() => {
                if (readonlyMediaAddSelected) {
                  setReadonlyMediaAddSelected(false);
                } else {
                  setSelectedTypes([]);
                  setAllSelected(false);
                  setCanApprovePermission(false);
                  setCanDeleteMediaPermission(false);
                  setReadonlyMediaAddSelected(true);
                }
              }}
              style={{
                background: readonlyMediaAddSelected ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: readonlyMediaAddSelected ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'var(--transition-fast)'
              }}
            >
              <input
                type="checkbox"
                checked={readonlyMediaAddSelected}
                onChange={() => {}} // Controlled click on container
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: readonlyMediaAddSelected ? 'var(--color-gold)' : 'var(--color-white)' }}>
                  🔒 🖼️ Solo Lectura + Multimedia (Agregar)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Permite ver toda la página pero no modificar nada, solo agregar archivos a multimedia.
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

            {/* Individual module toggles */}
            {Object.entries(MODULE_TYPES).map(([typeKey, typeInfo]) => {
              const isChecked = selectedTypes.includes(typeKey) || allSelected;
              const isOptionDisabled = allSelected || readonlyMediaAddSelected;
              return (
                <div
                  key={typeKey}
                  onClick={() => !isOptionDisabled && handleToggleType(typeKey)}
                  style={{
                    background: isChecked ? 'rgba(212, 168, 67, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                    border: isChecked ? '1px solid rgba(212, 168, 67, 0.4)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    cursor: isOptionDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'var(--transition-fast)',
                    opacity: allSelected ? 0.6 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={allSelected}
                    onChange={() => {}} // Controlled click on container
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)', cursor: allSelected ? 'not-allowed' : 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: isChecked ? 'var(--color-gold)' : 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {typeInfo.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '12px' }}
        >
          {editingUsername ? '💾 Guardar Cambios' : '➕ Crear Usuario'}
        </button>

        {editingUsername && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleCancelEdit}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '8px' }}
          >
            Cancelar Edición
          </button>
        )}
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TEMPLATES MANAGEMENT — Load, Apply, Delete
   ═══════════════════════════════════════════ */
function TemplatesManagement({ setViewMode }) {
  const { templates, createTemplate, applyTemplate, deleteTemplate, currentUser } = useCMS();
  const [templateName, setTemplateName] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [saving, setSaving] = useState(false);

  const isReadOnlyUser = currentUser?.allowedTypes?.includes('readonly_media_add');
  const isAdmin = (currentUser?.username === 'admin' || 
                  currentUser?.allowedTypes?.includes('approve') || 
                  currentUser?.allowedTypes?.includes('*')) && !isReadOnlyUser;

  const handleSave = async (e) => {
    e.preventDefault();
    const name = templateName.trim();
    if (!name) {
      setFeedback({ type: 'error', message: 'El nombre de la plantilla es requerido.' });
      return;
    }

    const exists = templates.some(t => t.template_name.toLowerCase() === name.toLowerCase());
    if (exists) {
      if (!window.confirm(`Ya existe una plantilla llamada "${name}". ¿Deseas sobrescribirla?`)) {
        return;
      }
    }

    setSaving(true);
    setFeedback(null);
    const success = await createTemplate(name);
    setSaving(false);

    if (success) {
      setTemplateName('');
      setFeedback({ type: 'success', message: `Plantilla "${name}" guardada con éxito.` });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: 'Error al guardar la plantilla.' });
    }
  };

  const handleApply = (t) => {
    if (window.confirm(`¿Seguro que deseas cargar la plantilla "${t.template_name}"? Esto reemplazará el borrador actual.`)) {
      const success = applyTemplate(t.config_data);
      if (success) {
        setViewMode('modules');
      } else {
        alert('Error al aplicar la plantilla.');
      }
    }
  };

  const handleDelete = async (t) => {
    if (window.confirm(`¿Seguro que deseas eliminar la plantilla "${t.template_name}" permanentemente?`)) {
      const success = await deleteTemplate(t.id);
      if (success) {
        setFeedback({ type: 'success', message: `Plantilla "${t.template_name}" eliminada.` });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert('Error al eliminar la plantilla.');
      }
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="templates-mgmt-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: isAdmin ? '1.2fr 2fr' : '1fr',
      gap: '32px',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-white)'
    }}>
      {/* Form panel for Admin / Info panel for Editor */}
      {isAdmin ? (
        <form onSubmit={handleSave} className="templates-create-panel" style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignSelf: 'start'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            letterSpacing: '0.5px',
            color: 'var(--color-white)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '12px',
            margin: 0,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📋</span> Guardar Plantilla
          </h2>
          
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Guarda la configuración actual del borrador (cuadrícula, orientación y todos sus módulos) como una plantilla reutilizable.
          </p>

          {feedback && (
            <div style={{
              background: feedback.type === 'success' ? 'rgba(56, 161, 105, 0.12)' : 'rgba(229, 62, 62, 0.12)',
              border: feedback.type === 'success' ? '1px solid rgba(56, 161, 105, 0.3)' : '1px solid rgba(229, 62, 62, 0.3)',
              color: feedback.type === 'success' ? '#48bb78' : '#feb2b2',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{feedback.type === 'success' ? '✅' : '❌'}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="field">
            <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
              Nombre de la Plantilla
            </label>
            <input
              type="text"
              placeholder="Ej. Diseño Mundial de Fútbol"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={saving}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-white)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '12px' }}
          >
            💾 {saving ? 'Guardando...' : 'Guardar Diseño Actual'}
          </button>
        </form>
      ) : (
        <div style={{
          background: 'rgba(212, 168, 67, 0.05)',
          border: '1px solid var(--color-border-gold)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          alignSelf: 'start',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: 'var(--color-gold)', marginBottom: '8px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ℹ️</span> Modo de Editor (Lectura)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Como Editor, puedes examinar y aplicar cualquiera de las plantillas creadas por el Administrador. 
            No tienes privilegios para crear nuevas plantillas ni eliminar las existentes.
          </p>
        </div>
      )}

      {/* Gallery Section */}
      <div className="templates-list-panel" style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          letterSpacing: '0.5px',
          color: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          margin: 0,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📂</span> Plantillas Disponibles
        </h2>

        {templates.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>📋</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-white)' }}>No hay plantillas guardadas</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '320px' }}>
              {isAdmin 
                ? 'Ingresa un nombre en el panel izquierdo y guarda la configuración de valla actual.' 
                : 'No se han creado plantillas aún en el sistema.'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            overflowY: 'auto',
            maxHeight: '650px',
            paddingRight: '4px'
          }}>
            {templates.map((t) => {
              const config = t.config_data || {};
              const cols = config.grid?.cols || 5;
              const rows = config.grid?.rows || 5;
              const orientation = config.orientation || 'horizontal';
              const modulesCount = config.modules?.length || 0;

              return (
                <div
                  key={t.id}
                  className="template-card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'transform var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        color: 'var(--color-white)',
                        fontWeight: 'bold',
                        wordBreak: 'break-word',
                        lineHeight: '1.3'
                      }}>
                        {t.template_name}
                      </h3>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px',
                            opacity: 0.7,
                            transition: 'opacity var(--transition-fast)'
                          }}
                          title="Eliminar plantilla"
                          onMouseEnter={(e) => e.target.style.opacity = '1'}
                          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      🕒 {formatDate(t.created_at)}
                    </span>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '8px',
                      fontSize: '11px'
                    }}>
                      <span style={{
                        background: 'rgba(212, 168, 67, 0.08)',
                        border: '1px solid rgba(212, 168, 67, 0.2)',
                        color: 'var(--color-gold)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        📐 Cuadrícula: {cols}x{rows}
                      </span>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {orientation === 'vertical' ? '📱 Vertical' : '🖥️ Horizontal'}
                      </span>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        📦 {modulesCount} Módulos
                      </span>
                    </div>

                    {/* Módulos inside this template */}
                    {modulesCount > 0 && (
                      <div style={{
                        marginTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '10px'
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 'bold' }}>
                          Módulos Incluidos:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {config.modules?.slice(0, 5).map((mod, idx) => (
                            <span
                              key={mod.id || idx}
                              style={{
                                fontSize: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--color-white)',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <span>{MODULE_TYPES[mod.type]?.icon || '⚙️'}</span>
                              <span>{mod.label}</span>
                            </span>
                          ))}
                          {modulesCount > 5 && (
                            <span style={{
                              fontSize: '10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--color-text-secondary)',
                              padding: '1px 6px',
                              borderRadius: '3px'
                            }}>
                              +{modulesCount - 5} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isReadOnlyUser && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      onClick={() => handleApply(t)}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      📥 Cargar Plantilla
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HISTORY AUDIT LOG — Admin Change History Panel
   ═══════════════════════════════════════════ */
function HistoryManagement({ setViewMode }) {
  const { history, fetchHistory, applyTemplate, currentUser } = useCMS();
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const isReadOnlyUser = currentUser?.allowedTypes?.includes('readonly_media_add');

  const migrateHistoryConfig = (config) => {
    if (!config) return null;
    if (config.layouts) return config;

    const parsed = JSON.parse(JSON.stringify(config));
    const originalGrid = parsed.grid || { cols: 5, rows: 5 };
    const originalPositions = {};
    (parsed.modules || []).forEach(mod => {
      originalPositions[mod.id] = mod.gridPosition || { col: 1, row: 1, colSpan: 1, rowSpan: 1 };
    });

    const defaults_12x6 = {
      "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
      "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
      "default_odds": { col: 6, row: 1, colSpan: 3, rowSpan: 2 },
      "default_hero": { col: 9, row: 1, colSpan: 4, rowSpan: 4 },
      "default_news": { col: 1, row: 2, colSpan: 2, rowSpan: 4 },
      "default_results": { col: 3, row: 3, colSpan: 3, rowSpan: 3 },
      "default_featured": { col: 6, row: 3, colSpan: 3, rowSpan: 3 },
      "default_upcoming": { col: 9, row: 5, colSpan: 4, rowSpan: 1 },
      "default_ticker": { col: 1, row: 6, colSpan: 12, rowSpan: 1 }
    };

    const defaults_9x9 = {
      "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
      "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
      "default_odds": { col: 6, row: 1, colSpan: 4, rowSpan: 2 },
      "default_hero": { col: 1, row: 3, colSpan: 5, rowSpan: 4 },
      "default_news": { col: 6, row: 3, colSpan: 4, rowSpan: 2 },
      "default_results": { col: 6, row: 5, colSpan: 4, rowSpan: 2 },
      "default_featured": { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
      "default_upcoming": { col: 5, row: 7, colSpan: 5, rowSpan: 2 },
      "default_ticker": { col: 1, row: 9, colSpan: 9, rowSpan: 1 }
    };

    const createHistoryPositions = (modules, targetCols, targetRows) => {
      const positions = {};
      const layoutDefaults = (targetCols === 12 && targetRows === 6) ? defaults_12x6 : defaults_9x9;
      modules.forEach(mod => {
        if (layoutDefaults[mod.id]) {
          positions[mod.id] = { ...layoutDefaults[mod.id] };
        } else if (originalPositions[mod.id]) {
          let { col, row, colSpan, rowSpan } = originalPositions[mod.id];
          colSpan = Math.max(1, Math.min(targetCols, colSpan));
          rowSpan = Math.max(1, Math.min(targetRows, rowSpan));
          col = Math.max(1, Math.min(targetCols - colSpan + 1, col));
          row = Math.max(1, Math.min(targetRows - rowSpan + 1, row));
          positions[mod.id] = { col, row, colSpan, rowSpan };
        } else {
          positions[mod.id] = { col: 1, row: 1, colSpan: 1, rowSpan: 1 };
        }
      });
      return positions;
    };

    parsed.layouts = {
      "12x6": {
        grid: { cols: 12, rows: 6 },
        positions: createHistoryPositions(parsed.modules || [], 12, 6)
      },
      "9x9": {
        grid: { cols: 9, rows: 9 },
        positions: createHistoryPositions(parsed.modules || [], 9, 9)
      }
    };
    parsed.activeLayout = "12x6";
    return parsed;
  };

  const getHistoryModules = (config) => {
    if (!config) return [];
    const migrated = migrateHistoryConfig(config);
    const layoutName = migrated.activeLayout || '12x6';
    const layoutObj = migrated.layouts?.[layoutName] || { grid: { cols: 12, rows: 6 }, positions: {} };
    return (migrated.modules || []).map(mod => ({
      ...mod,
      gridPosition: layoutObj.positions?.[mod.id] || { col: 1, row: 1, colSpan: 1, rowSpan: 1 }
    }));
  };

  const getHistoryGrid = (config) => {
    if (!config) return { cols: 12, rows: 6 };
    const migrated = migrateHistoryConfig(config);
    const layoutName = migrated.activeLayout || '12x6';
    return migrated.layouts?.[layoutName]?.grid || { cols: 12, rows: 6 };
  };

  const getHistoryGridText = (config) => {
    if (!config) return '';
    const migrated = migrateHistoryConfig(config);
    const layoutName = migrated.activeLayout || '12x6';
    const grid = migrated.layouts?.[layoutName]?.grid || { cols: 12, rows: 6 };
    const orientation = migrated.orientation === 'vertical' ? 'Vertical' : 'Horizontal';
    return `${grid.cols}x${grid.rows} | ${orientation}`;
  };

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      await fetchHistory();
      setLoading(false);
    }
    loadHistory();
  }, [fetchHistory]);

  const toggleRow = (version) => {
    setExpandedRows(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  const handleRestore = (entry) => {
    const editorName = entry.modified_by || 'Desconocido';
    const approverName = entry.approved_by || entry.username || 'Desconocido';
    if (window.confirm(`¿Deseas cargar la configuración de la versión del ${formatDate(entry.created_at)} (Modificado por: ${editorName}, Aprobado por: ${approverName}) en tu borrador de edición actual?`)) {
      applyTemplate(entry.config_data);
      alert('Se ha cargado la versión seleccionada en tu borrador. Puedes revisarla y hacer clic en "Aprobar y Publicar" para activarla.');
      setViewMode('modules');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-ES', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Función de comparación antes / después
  const getDifferences = (currentEntry, index) => {
    const beforeEntry = history[index + 1];
    const beforeConfig = beforeEntry ? beforeEntry.config_data : null;
    const afterConfig = currentEntry.config_data;
    
    return compareConfigs(beforeConfig, afterConfig);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-white)', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>
            📜 Historial de Auditoría de Cambios
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
            Visualiza el historial completo de cambios publicados, compara los cambios ("Antes" y "Después") y restaura versiones anteriores al borrador de edición.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={() => setViewMode('modules')}>
          ✕ Cerrar
        </button>
      </div>

      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Cargando historial...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>📖</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-white)' }}>No hay cambios registrados en el historial</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Los cambios aparecerán aquí cada vez que se apruebe y publique una nueva versión de la valla.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-white)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}></th>
                <th style={{ padding: '12px 16px' }}>Fecha y Hora</th>
                <th style={{ padding: '12px 16px' }}>Usuario Responsable (Aprobador)</th>
                <th style={{ padding: '12px 16px' }}>Usuario Modificador (Editor)</th>
                <th style={{ padding: '12px 16px' }}>Versión ID</th>
                <th style={{ padding: '12px 16px' }}>Resumen</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => {
                const modulesCount = entry.config_data?.modules?.length || 0;
                const isExpanded = !!expandedRows[entry.version];
                const beforeEntry = history[index + 1];
                const diffs = getDifferences(entry, index);

                return (
                  <Fragment key={entry.version}>
                    <tr 
                      style={{ 
                        borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)', 
                        transition: 'background-color var(--transition-fast)',
                        cursor: 'pointer'
                      }} 
                      onClick={() => toggleRow(entry.version)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'} 
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-gold)' }}>
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '500', color: 'var(--color-white)' }}>
                        {formatDate(entry.created_at)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: 'rgba(56, 161, 105, 0.1)', border: '1px solid rgba(56, 161, 105, 0.2)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', display: 'inline-block' }}>
                          {entry.approved_by || entry.username || 'Desconocido'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: 'rgba(212, 168, 67, 0.1)', border: '1px solid var(--color-border-gold)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', display: 'inline-block' }}>
                          {entry.modified_by || 'Desconocido'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
                        {entry.version}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--color-white)' }}>{modulesCount}</span> módulos ({entry.config_data?.orientation || 'horizontal'})
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        {!isReadOnlyUser && (
                          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleRestore(entry)} style={{ display: 'inline-flex', gap: '4px' }}>
                            📥 Restaurar en Borrador
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <td colSpan="7" style={{ padding: '20px 24px 24px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                              {/* ANTES */}
                              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--color-border)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 'bold', letterSpacing: '1px' }}>
                                    ⏪ Estado Anterior (Antes)
                                  </div>
                                  {beforeEntry && (
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                      {getHistoryGridText(beforeEntry.config_data)}
                                    </div>
                                  )}
                                </div>
                                {beforeEntry ? (
                                  <div style={{ 
                                    height: '260px', 
                                    position: 'relative', 
                                    overflow: 'hidden', 
                                    borderRadius: 'var(--radius-sm)', 
                                    border: '1px solid var(--color-border)',
                                    background: '#020202'
                                  }}>
                                    <LivePreview 
                                      modules={getHistoryModules(beforeEntry.config_data)} 
                                      grid={getHistoryGrid(beforeEntry.config_data)} 
                                      screenType={beforeEntry.config_data?.orientation || 'horizontal'} 
                                    />
                                  </div>
                                ) : (
                                  <div style={{ 
                                    color: 'var(--color-text-muted)', 
                                    fontSize: '13px', 
                                    fontStyle: 'italic', 
                                    height: '260px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: 'var(--radius-sm)'
                                  }}>
                                    No hay estado anterior (Configuración de origen / inicial).
                                  </div>
                                )}
                              </div>

                              {/* DESPUÉS */}
                              <div style={{ background: 'rgba(212, 168, 67, 0.02)', border: '1px dashed var(--color-border-gold)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 'bold', letterSpacing: '1px' }}>
                                    ⏩ Estado Nuevo (Después)
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: '500' }}>
                                    {getHistoryGridText(entry.config_data)}
                                  </div>
                                </div>
                                <div style={{ 
                                  height: '260px', 
                                  position: 'relative', 
                                  overflow: 'hidden', 
                                  borderRadius: 'var(--radius-sm)', 
                                  border: '1px solid var(--color-border-gold)',
                                  background: '#020202'
                                }}>
                                  <LivePreview 
                                    modules={getHistoryModules(entry.config_data)} 
                                    grid={getHistoryGrid(entry.config_data)} 
                                    screenType={entry.config_data?.orientation || 'horizontal'} 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* LOG DE CAMBIOS DETALLADOS */}
                            <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-white)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>
                                🛠️ Detalle de Modificaciones Realizadas
                              </div>
                              {diffs.length === 0 ? (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                                  No se detectaron diferencias estructurales en esta versión (ej. re-publicación de la misma configuración).
                                </div>
                              ) : (
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {diffs.map((diff, i) => (
                                    <li key={i} style={{ lineHeight: '1.4' }}>
                                      {diff}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

