import { useCMS } from '../../../context/CMSContext';

export default function ScoreboardEditor({ content, updateModuleContent, moduleId, onOpenLibrary }) {
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

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Estilos del Marcador
      </h3>
      <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Fondo score A */}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Tipo de Fondo A (Local)</label>
          <select
            value={
              content.scoreBgTypeA === 'color'
                ? 'color'
                : (content.scoreBgTypeA === 'image' || content.scoreBgTypeA === 'video' || content.scoreBgTypeA === 'multimedia')
                  ? 'multimedia'
                  : 'color'
            }
            onChange={(e) => updateModuleContent(moduleId, { scoreBgTypeA: e.target.value })}
            style={{ marginBottom: '8px' }}
          >
            <option value="color">Color Sólido</option>
            <option value="multimedia">Imagen / Video</option>
          </select>

          {(content.scoreBgTypeA === 'color' || !content.scoreBgTypeA) && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <input
                type="color"
                value={content.scoreBgColorA && /^#[0-9A-F]{6}$/i.test(content.scoreBgColorA) ? content.scoreBgColorA : '#ffd014'}
                onChange={(e) => updateModuleContent(moduleId, { scoreBgColorA: e.target.value })}
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
                value={content.scoreBgColorA || ''}
                onChange={(e) => updateModuleContent(moduleId, { scoreBgColorA: e.target.value })}
                placeholder="Ej: #ffd014"
                style={{ flex: 1 }}
              />
              {content.scoreBgColorA && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px', height: '42px' }}
                  onClick={() => updateModuleContent(moduleId, { scoreBgColorA: '' })}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {(content.scoreBgTypeA === 'multimedia' || content.scoreBgTypeA === 'image' || content.scoreBgTypeA === 'video') && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <input
                type="text"
                value={content.scoreBgUrlA || content.scoreBgImageA || content.scoreBgVideoA || ''}
                onChange={(e) => updateModuleContent(moduleId, { 
                  scoreBgUrlA: e.target.value,
                  scoreBgImageA: '',
                  scoreBgVideoA: ''
                })}
                placeholder="URL de Imagen o Video de Fondo A"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '10px 14px', whiteSpace: 'nowrap', height: '42px' }}
                onClick={() => {
                  onOpenLibrary((url) => {
                    updateModuleContent(moduleId, { 
                      scoreBgUrlA: url,
                      scoreBgImageA: '',
                      scoreBgVideoA: ''
                    });
                  });
                }}
              >
                📁 Elegir
              </button>
            </div>
          )}
        </div>

        {/* Fondo score B */}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Tipo de Fondo B (Visitante)</label>
          <select
            value={
              content.scoreBgTypeB === 'color'
                ? 'color'
                : (content.scoreBgTypeB === 'image' || content.scoreBgTypeB === 'video' || content.scoreBgTypeB === 'multimedia')
                  ? 'multimedia'
                  : 'color'
            }
            onChange={(e) => updateModuleContent(moduleId, { scoreBgTypeB: e.target.value })}
            style={{ marginBottom: '8px' }}
          >
            <option value="color">Color Sólido</option>
            <option value="multimedia">Imagen / Video</option>
          </select>

          {(content.scoreBgTypeB === 'color' || !content.scoreBgTypeB) && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <input
                type="color"
                value={content.scoreBgColorB && /^#[0-9A-F]{6}$/i.test(content.scoreBgColorB) ? content.scoreBgColorB : '#ffd014'}
                onChange={(e) => updateModuleContent(moduleId, { scoreBgColorB: e.target.value })}
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
                value={content.scoreBgColorB || ''}
                onChange={(e) => updateModuleContent(moduleId, { scoreBgColorB: e.target.value })}
                placeholder="Ej: #ffd014"
                style={{ flex: 1 }}
              />
              {content.scoreBgColorB && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px', height: '42px' }}
                  onClick={() => updateModuleContent(moduleId, { scoreBgColorB: '' })}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {(content.scoreBgTypeB === 'multimedia' || content.scoreBgTypeB === 'image' || content.scoreBgTypeB === 'video') && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <input
                type="text"
                value={content.scoreBgUrlB || content.scoreBgImageB || content.scoreBgVideoB || ''}
                onChange={(e) => updateModuleContent(moduleId, { 
                  scoreBgUrlB: e.target.value,
                  scoreBgImageB: '',
                  scoreBgVideoB: ''
                })}
                placeholder="URL de Imagen o Video de Fondo B"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '10px 14px', whiteSpace: 'nowrap', height: '42px' }}
                onClick={() => {
                  onOpenLibrary((url) => {
                    updateModuleContent(moduleId, { 
                      scoreBgUrlB: url,
                      scoreBgImageB: '',
                      scoreBgVideoB: ''
                    });
                  });
                }}
              >
                📁 Elegir
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
