import { useState, useEffect, Fragment } from 'react';
import { useCMS, MODULE_TYPES } from '../../context/CMSContext';
import { LivePreview } from '../../views/AdminPanel';

const compareConfigs = (before, after) => {
  const changes = [];
  if (!after) {
    return changes;
  }
  if (!before) {
    changes.push("Configuración inicial creada.");
    return changes;
  }

  if (before.orientation !== after.orientation) {
    changes.push(`Orientación de pantalla cambiada de "${before.orientation || 'horizontal'}" a "${after.orientation || 'horizontal'}"`);
  }

  const beforeGrid = before.grid || { cols: 5, rows: 5 };
  const afterGrid = after.grid || { cols: 5, rows: 5 };
  if (beforeGrid.cols !== afterGrid.cols || beforeGrid.rows !== afterGrid.rows) {
    changes.push(`Dimensiones de cuadrícula cambiadas de ${beforeGrid.cols}x${beforeGrid.rows} a ${afterGrid.cols}x${afterGrid.rows}`);
  }

  const beforeModules = before.modules || [];
  const afterModules = after.modules || [];

  const beforeMap = new Map(beforeModules.map(m => [m.id, m]));
  const afterMap = new Map(afterModules.map(m => [m.id, m]));

  // Modificados y Agregados
  for (const mod of afterModules) {
    if (!beforeMap.has(mod.id)) {
      changes.push(`Agregado: módulo "${mod.label}" (${MODULE_TYPES[mod.type]?.label || mod.type})`);
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
        changes.push(`Modificado: módulo "${mod.label}" (${modDiffs.join(', ')})`);
      }
    }
  }

  // Eliminados
  for (const mod of beforeModules) {
    if (!afterMap.has(mod.id)) {
      changes.push(`Eliminado: módulo "${mod.label}" (${MODULE_TYPES[mod.type]?.label || mod.type})`);
    }
  }

  return changes;
};

export default function HistoryPanel({ setViewMode }) {
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
      "default_featured": { col: 6, row: 3, colSpan: 3, rowSpan: 3 },
      "default_upcoming": { col: 9, row: 5, colSpan: 4, rowSpan: 1 }
    };

    const defaults_9x9 = {
      "default_brand": { col: 1, row: 1, colSpan: 2, rowSpan: 1 },
      "default_scoreboard": { col: 3, row: 1, colSpan: 3, rowSpan: 2 },
      "default_odds": { col: 6, row: 1, colSpan: 4, rowSpan: 2 },
      "default_hero": { col: 1, row: 3, colSpan: 5, rowSpan: 4 },
      "default_featured": { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
      "default_upcoming": { col: 5, row: 7, colSpan: 5, rowSpan: 2 }
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
