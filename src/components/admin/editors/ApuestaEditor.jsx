import { useCMS } from '../../../context/CMSContext';

export default function ApuestaEditor({ content, onChange, updateModuleContent, moduleId, onOpenLibrary }) {
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
          flag: teamObj.flag,
          code: teamObj.code
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
        <label style={{ display: 'block', fontWeight: 'normal', color: 'var(--color-white)', marginBottom: '4px' }}>
          Tamaño de los números de cuotas (Escala: {content.apuestaOddScale !== undefined ? content.apuestaOddScale : '1.0'}x)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={content.apuestaOddScale !== undefined ? content.apuestaOddScale : 1.0}
            onChange={(e) => onChange('apuestaOddScale', parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-gold)', height: '6px', cursor: 'pointer' }}
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onChange('apuestaOddScale', 1.0)}
          >
            Restablecer (1.0x)
          </button>
        </div>
      </div>

      <style>{`
        .field-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .field-row-3 {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

      {/* Team A quick select and details */}
      <h3 style={{ fontSize: '13px', color: 'var(--color-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {content.mode === '1-way' ? 'Opción Única (Jugador / Equipo)' : 'Opción A (Local)'}
      </h3>
      <div className="field-row-3" style={{ marginBottom: '16px' }}>
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
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Nombre</label>
          <input
            type="text"
            value={content.teamA?.name || ''}
            onChange={(e) => updateTeam('teamA', 'name', e.target.value)}
            placeholder={content.mode === '1-way' ? '(Opcional) Nombre del jugador/equipo' : '(Opcional) Nombre del equipo'}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Código (Abreviatura)</label>
          <input
            type="text"
            value={content.teamA?.code || ''}
            onChange={(e) => updateTeam('teamA', 'code', e.target.value.toUpperCase())}
            placeholder="(Opcional) ej: MEX"
            maxLength={5}
          />
        </div>
      </div>

      <div className="field-row" style={{ marginBottom: '16px' }}>
        <div className="field">
          <label>Cuota (ej: 1,46)</label>
          <input
            type="text"
            value={content.teamA?.odd || ''}
            onChange={(e) => updateTeam('teamA', 'odd', e.target.value)}
          />
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
          <div className="field-row-3" style={{ marginBottom: '16px' }}>
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
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Equipo B — Nombre</label>
              <input
                type="text"
                value={content.teamB?.name || ''}
                onChange={(e) => updateTeam('teamB', 'name', e.target.value)}
                placeholder="(Opcional) Nombre del equipo"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Código (Abreviatura)</label>
              <input
                type="text"
                value={content.teamB?.code || ''}
                onChange={(e) => updateTeam('teamB', 'code', e.target.value.toUpperCase())}
                placeholder="(Opcional) ej: ZAF"
                maxLength={5}
              />
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: '16px' }}>
            <div className="field">
              <label>Equipo B — Cuota (ej: 6,66)</label>
              <input
                type="text"
                value={content.teamB?.odd || ''}
                onChange={(e) => updateTeam('teamB', 'odd', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
