import { useState } from 'react';
import { useCMS, MODULE_TYPES } from '../../context/CMSContext';

export default function TemplateManager({ setViewMode }) {
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
                        {modulesCount} Módulos
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
