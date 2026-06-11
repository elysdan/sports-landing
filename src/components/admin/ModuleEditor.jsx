import { MODULE_TYPES } from '../../context/CMSContext';
import MediaEditor from './editors/MediaEditor';
import ScoreboardEditor from './editors/ScoreboardEditor';
import UpcomingEditor from './editors/UpcomingEditor';
import ApuestaEditor from './editors/ApuestaEditor';
import PreguntaEditor from './editors/PreguntaEditor';

export default function ModuleEditor({ module, updateModule, updateModuleContent, removeModule, onOpenLibrary, canEdit }) {
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

  const handleLayoutScaleChange = (value) => {
    if (!canEdit) return;
    updateModule(module.id, {
      gridPosition: { ...module.gridPosition, scaleFactor: parseFloat(value) || 1.0 }
    });
  };

  const currentScaleFactor = module.gridPosition?.scaleFactor !== undefined
    ? module.gridPosition.scaleFactor
    : (module.content?.scaleFactor !== undefined ? module.content.scaleFactor : 1.0);

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
              teamFlagId: '',
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
    updateModuleContent(module.id, { src: url, mediaType: type, teamFlagId: '' });
  };

  const handleBgMediaUpload = (e, type) => {
    if (!canEdit) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
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
            if (type === 'image') {
              updateModuleContent(module.id, { moduleBgImage: data.url });
            } else if (type === 'video') {
              updateModuleContent(module.id, { moduleBgVideo: data.url });
            }
          } else {
            console.error('Error al subir archivo de fondo:', data.error);
            alert('Error al subir el archivo de fondo: ' + (data.error || 'Desconocido'));
          }
        })
        .catch((err) => {
          console.error('Error de red al subir archivo de fondo:', err);
          alert('Error de red al intentar subir el archivo de fondo.');
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="admin-main-scroll">
      {!canEdit && (
        <div style={{ background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', color: '#ef5350', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>No tienes permisos para modificar este tipo de módulo (Sólo Lectura).</span>
        </div>
      )}

      <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '24px', opacity: canEdit ? 1 : 0.85 }}>
        <div className="editor-header">
          <div>
            <div className="editor-title">{module.label}</div>
          </div>
          <div className="editor-badge">
            <span>{MODULE_TYPES[module.type]?.icon}</span>
            <span>{MODULE_TYPES[module.type]?.label}</span>
          </div>
        </div>

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
                value={module.content.moduleBgType || (module.content.moduleBgTransparent === true ? 'transparent' : 'color')}
                onChange={(e) => {
                  const val = e.target.value;
                  handleContentChange('moduleBgType', val);
                  handleContentChange('moduleBgTransparent', val === 'transparent');
                }}
                style={{ marginTop: '6px' }}
              >
                <option value="transparent">Fondo Transparente</option>
                <option value="color">Color Sólido</option>
                <option value="image">Imagen de Fondo</option>
                <option value="video">Video de Fondo</option>
              </select>

              {(module.content.moduleBgType === 'color' || (!module.content.moduleBgType && module.content.moduleBgTransparent !== true)) && (
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

              {module.content.moduleBgType === 'image' && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Imagen de Fondo</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                      onClick={() => onOpenLibrary((url) => handleContentChange('moduleBgImage', url))}
                    >
                      🖼️ Elegir de Biblioteca
                    </button>
                    <label className="admin-btn admin-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', margin: 0 }}>
                      📤 Subir Imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBgMediaUpload(e, 'image')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={module.content.moduleBgImage || ''}
                    onChange={(e) => handleContentChange('moduleBgImage', e.target.value)}
                    placeholder="URL de la imagen de fondo"
                    style={{ fontSize: '12px' }}
                  />
                  {module.content.moduleBgImage && (
                    <div style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
                      <img
                        src={module.content.moduleBgImage}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: module.content.moduleBgObjectFit || 'cover', opacity: module.content.moduleBgOpacity !== undefined ? module.content.moduleBgOpacity : 1.0 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleContentChange('moduleBgImage', '')}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {module.content.moduleBgType === 'video' && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Video de Fondo</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                      onClick={() => onOpenLibrary((url) => handleContentChange('moduleBgVideo', url))}
                    >
                      🎥 Elegir de Biblioteca
                    </button>
                    <label className="admin-btn admin-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', margin: 0 }}>
                      📤 Subir Video
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => handleBgMediaUpload(e, 'video')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={module.content.moduleBgVideo || ''}
                    onChange={(e) => handleContentChange('moduleBgVideo', e.target.value)}
                    placeholder="URL del video de fondo"
                    style={{ fontSize: '12px' }}
                  />
                  {module.content.moduleBgVideo && (
                    <div style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
                      <video
                        src={module.content.moduleBgVideo}
                        muted
                        loop
                        autoPlay
                        style={{ width: '100%', height: '100%', objectFit: module.content.moduleBgObjectFit || 'cover', opacity: module.content.moduleBgOpacity !== undefined ? module.content.moduleBgOpacity : 1.0 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleContentChange('moduleBgVideo', '')}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(module.content.moduleBgType === 'image' || module.content.moduleBgType === 'video') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Ajuste de Fondo</label>
                    <select
                      value={module.content.moduleBgObjectFit || 'cover'}
                      onChange={(e) => handleContentChange('moduleBgObjectFit', e.target.value)}
                      style={{ marginTop: '4px', fontSize: '12px', padding: '6px' }}
                    >
                      <option value="cover">Cubrir (cover)</option>
                      <option value="contain">Contener (contain)</option>
                      <option value="fill">Rellenar (fill)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Opacidad de Fondo</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={module.content.moduleBgOpacity !== undefined ? module.content.moduleBgOpacity : 1.0}
                        onChange={(e) => handleContentChange('moduleBgOpacity', parseFloat(e.target.value))}
                        style={{ flex: 1, height: '4px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', minWidth: '30px', textAlign: 'right' }}>
                        {Math.round((module.content.moduleBgOpacity !== undefined ? module.content.moduleBgOpacity : 1.0) * 100)}%
                      </span>
                    </div>
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

          <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Proporciones del Módulo (Escala de Elementos)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={currentScaleFactor}
                  onChange={(e) => handleLayoutScaleChange(e.target.value)}
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
                  {currentScaleFactor.toFixed(2)}x
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Ajusta las proporciones, espacios y tamaño de las tarjetas/elementos dentro de este módulo.
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0, opacity: 0, pointerEvents: 'none' }}>
              {/* Spacer */}
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

          {module.type === 'upcoming' && (
            <UpcomingEditor
              content={module.content}
              onChange={handleContentChange}
              updateModuleContent={updateModuleContent}
              moduleId={module.id}
              onOpenLibrary={onOpenLibrary}
            />
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
