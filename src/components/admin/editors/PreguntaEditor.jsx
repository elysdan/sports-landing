export default function PreguntaEditor({ content, onChange, updateModuleContent, moduleId }) {
  const yesType = content.yesType || 'text';
  const noType = content.noType || 'text';

  const stickerOptions = [
    { value: 'sticker1.png', label: 'Sticker 1' },
    { value: 'sticker2.png', label: 'Sticker 2' },
    { value: 'sticker3.png', label: 'Sticker 3' }
  ];

  return (
    <>
      <div className="field-row">
        <div className="field">
          <label>Pregunta / Título (ej: ¿AMBOS EQUIPOS ANOTARÁN?)</label>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Posición de la Pregunta / Título</label>
          <select
            value={content.titlePosition || 'top'}
            onChange={(e) => onChange('titlePosition', e.target.value)}
          >
            <option value="top">Arriba (Por defecto)</option>
            <option value="bottom">Abajo</option>
          </select>
        </div>
      </div>

      {/* --- Diseño del Título --- */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginTop: '20px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Estilos del Título
      </h3>

      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field">
          <label>Tamaño de Fuente (Título)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.05"
              value={content.titleFontSize !== undefined ? content.titleFontSize : 1.0}
              onChange={(e) => onChange('titleFontSize', parseFloat(e.target.value))}
              style={{ flex: 1, height: '6px', accentColor: 'var(--color-primary)' }}
            />
            <input
              type="number"
              min="0.1"
              max="100.0"
              step="0.05"
              value={content.titleFontSize !== undefined ? content.titleFontSize : 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange('titleFontSize', isNaN(val) ? 1.0 : val);
              }}
              style={{ width: '70px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-gold)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
            />
          </div>
        </div>
        <div className="field">
          <label>Color de Letras (Título)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <input
              type="color"
              value={content.titleTextColor && /^#[0-9A-F]{6}$/i.test(content.titleTextColor) ? content.titleTextColor : '#ffffff'}
              onChange={(e) => onChange('titleTextColor', e.target.value)}
              style={{ width: '36px', height: '36px', padding: '2px', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
            />
            <input
              type="text"
              value={content.titleTextColor || ''}
              onChange={(e) => onChange('titleTextColor', e.target.value)}
              placeholder="Ej: #ffffff"
              style={{ flex: 1, padding: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="field" style={{ marginBottom: '20px' }}>
        <label>Color de Fondo del Título</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
          <input
            type="color"
            value={content.titleBgColor && /^#[0-9A-F]{6}$/i.test(content.titleBgColor) ? content.titleBgColor : '#000000'}
            onChange={(e) => onChange('titleBgColor', e.target.value)}
            style={{ width: '36px', height: '36px', padding: '2px', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
          />
          <input
            type="text"
            value={content.titleBgColor || ''}
            onChange={(e) => onChange('titleBgColor', e.target.value)}
            placeholder="Ej: #161616 o dejar vacío para transparente"
            style={{ flex: 1, padding: '8px' }}
          />
          {content.titleBgColor && (
            <button
              type="button"
              onClick={() => onChange('titleBgColor', '')}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      {/* --- Diseño General de las Opciones --- */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Estilos Generales de las Opciones
      </h3>

      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field">
          <label>Tamaño de Letras o Stickers (SÍ/NO)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.05"
              value={content.optionLabelScale !== undefined ? content.optionLabelScale : (content.optionScaleFactor !== undefined ? content.optionScaleFactor : 1.0)}
              onChange={(e) => onChange('optionLabelScale', parseFloat(e.target.value))}
              style={{ flex: 1, height: '6px', accentColor: 'var(--color-primary)' }}
            />
            <input
              type="number"
              min="0.1"
              max="100.0"
              step="0.05"
              value={content.optionLabelScale !== undefined ? content.optionLabelScale : (content.optionScaleFactor !== undefined ? content.optionScaleFactor : 1.0)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange('optionLabelScale', isNaN(val) ? 1.0 : val);
              }}
              style={{ width: '70px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-gold)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div className="field">
          <label>Tamaño de Números (Cuotas)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.05"
              value={content.optionValueScale !== undefined ? content.optionValueScale : (content.optionScaleFactor !== undefined ? content.optionScaleFactor : 1.0)}
              onChange={(e) => onChange('optionValueScale', parseFloat(e.target.value))}
              style={{ flex: 1, height: '6px', accentColor: 'var(--color-primary)' }}
            />
            <input
              type="number"
              min="0.1"
              max="100.0"
              step="0.05"
              value={content.optionValueScale !== undefined ? content.optionValueScale : (content.optionScaleFactor !== undefined ? content.optionScaleFactor : 1.0)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange('optionValueScale', isNaN(val) ? 1.0 : val);
              }}
              style={{ width: '70px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-gold)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      <div className="field" style={{ marginBottom: '20px' }}>
        <label>Dirección del Contenido</label>
        <select
          value={content.optionLayout || 'vertical'}
          onChange={(e) => onChange('optionLayout', e.target.value)}
          style={{ marginTop: '6px' }}
        >
          <option value="vertical">Apilado (Sticker/Texto arriba, Cuota abajo)</option>
          <option value="horizontal">Lado a Lado (Sticker/Texto a la izquierda, Cuota a la derecha)</option>
        </select>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      {/* --- Opción Izquierda --- */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Opción Izquierda
      </h3>

      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field">
          <label>Tipo de Contenido</label>
          <select
            value={yesType}
            onChange={(e) => onChange('yesType', e.target.value)}
          >
            <option value="text">Texto personalizado</option>
            <option value="sticker">Agregar un Sticker</option>
          </select>
        </div>

        {yesType === 'text' ? (
          <div className="field">
            <label>Texto (ej: SÍ, SE VA, METE GOL)</label>
            <input
              type="text"
              value={content.yesText !== undefined ? content.yesText : 'SI'}
              onChange={(e) => onChange('yesText', e.target.value)}
              placeholder="Escribe el texto de la opción"
            />
          </div>
        ) : (
          <div className="field">
            <label>Seleccionar Sticker</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={content.yesSticker || 'sticker1.png'}
                onChange={(e) => onChange('yesSticker', e.target.value)}
                style={{ flex: 1 }}
              >
                {stickerOptions.map(opt => (
                  <option key={`yes-st-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div style={{
                width: '42px',
                height: '42px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                flexShrink: 0
              }}>
                <img
                  src={`/${content.yesSticker || 'sticker1.png'}`}
                  alt="Preview"
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="field" style={{ marginBottom: '20px' }}>
        <label>Cuota para Opción Izquierda (ej: 1,85)</label>
        <input
          type="text"
          value={content.yesOdd || ''}
          onChange={(e) => onChange('yesOdd', e.target.value)}
          placeholder="ej: 1.85"
        />
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      {/* --- Opción Derecha --- */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Opción Derecha
      </h3>

      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field">
          <label>Tipo de Contenido</label>
          <select
            value={noType}
            onChange={(e) => onChange('noType', e.target.value)}
          >
            <option value="text">Texto personalizado</option>
            <option value="sticker">Agregar un Sticker</option>
          </select>
        </div>

        {noType === 'text' ? (
          <div className="field">
            <label>Texto (ej: NO, SE QUEDA, ROJA)</label>
            <input
              type="text"
              value={content.noText !== undefined ? content.noText : 'NO'}
              onChange={(e) => onChange('noText', e.target.value)}
              placeholder="Escribe el texto de la opción"
            />
          </div>
        ) : (
          <div className="field">
            <label>Seleccionar Sticker</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={content.noSticker || 'sticker1.png'}
                onChange={(e) => onChange('noSticker', e.target.value)}
                style={{ flex: 1 }}
              >
                {stickerOptions.map(opt => (
                  <option key={`no-st-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div style={{
                width: '42px',
                height: '42px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                flexShrink: 0
              }}>
                <img
                  src={`/${content.noSticker || 'sticker1.png'}`}
                  alt="Preview"
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="field" style={{ marginBottom: '20px' }}>
        <label>Cuota para Opción Derecha (ej: 1,95)</label>
        <input
          type="text"
          value={content.noOdd || ''}
          onChange={(e) => onChange('noOdd', e.target.value)}
          placeholder="ej: 1.95"
        />
      </div>
    </>
  );
}
