import { useCMS } from '../../../context/CMSContext';

export default function MediaEditor({ content, onChange, onUpload, onOpenLibrary }) {
  const { worldCupTeams = [] } = useCMS();

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

      <div className="field" style={{ marginTop: 16 }}>
        <label>Seleccionar Bandera de Selección / País</label>
        <select
          value={content.teamFlagId || ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange('teamFlagId', val);
            if (val) {
              onChange('src', `/paises/${val}.svg`);
              onChange('mediaType', 'image');
            } else {
              onChange('src', '');
            }
          }}
        >
          <option value="">-- Ninguno (Subir o usar Biblioteca) --</option>
          {worldCupTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.flag && !team.flag.startsWith('/') && !team.flag.startsWith('http') && !team.flag.includes('.') ? team.flag : '🚩'} {team.name} ({team.code})
            </option>
          ))}
        </select>
      </div>

      {content.src && (
        <div className="media-preview">
          {content.mediaType === 'video' ? (
            <video className={content.objectFit || 'contain'} src={content.src} controls muted style={{ width: '100%', maxHeight: 200, objectFit: content.objectFit || 'contain' }} />
          ) : (
            <img className={content.objectFit || 'contain'} src={content.src} alt="Preview" style={{ objectFit: content.objectFit || 'contain' }} />
          )}
          <button className="media-preview-remove" onClick={() => { onChange('src', ''); onChange('teamFlagId', ''); }}>✕</button>
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
