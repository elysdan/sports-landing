import { useCMS } from '../../../context/CMSContext';

export default function UpcomingEditor({ content, onChange, updateModuleContent, moduleId, onOpenLibrary }) {
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
        <label>Hora</label>
        <input type="text" value={content.time || ''} onChange={(e) => onChange('time', e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: '12px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', color: 'var(--color-white)' }}>
          <input
            type="checkbox"
            checked={content.showVS !== false}
            onChange={(e) => onChange('showVS', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }}
          />
          Mostrar separador "VS" en el centro
        </label>
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

          <label style={{ marginTop: '6px' }}>Equipo A — Número (a su lado al centro)</label>
          <input type="text" value={content.numA || ''} onChange={(e) => onChange('numA', e.target.value)} placeholder="Número / Cuota" />

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

          <label style={{ marginTop: '6px' }}>Equipo B — Número (a su lado al centro)</label>
          <input type="text" value={content.numB || ''} onChange={(e) => onChange('numB', e.target.value)} placeholder="Número / Cuota" />

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
