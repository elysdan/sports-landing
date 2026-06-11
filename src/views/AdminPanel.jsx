import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCMS, MODULE_TYPES } from '../context/CMSContext';
import MediaLibraryModal from '../components/MediaLibraryModal';
import TemplateManager from '../components/admin/TemplateManager';
import HistoryPanel from '../components/admin/HistoryPanel';
import UserManager from '../components/admin/UserManager';
import ModuleEditor from '../components/admin/ModuleEditor';
import LayoutPreview from '../components/admin/LayoutPreview';

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

export default function AdminPanel() {
  const { draftData, liveData, currentUser, login, logout, users, hasPermission, hasPendingChanges, approveAndPublish, discardDraft, addModule, removeModule, updateModule, updateModuleContent, moveModule, updateGrid, activeLayout, switchLayout } = useCMS();
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

  // Modo de vista: 'modules' (diseño de cuadrícula), 'editors' (gestión de editores), 'templates' (plantillas), 'history' (historial)
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
          <UserManager />
        </div>
      ) : viewMode === 'templates' ? (
        <div className="admin-editors-fullpage" style={{ gridColumn: '1 / -1', gridRow: '2', padding: '40px', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
          <TemplateManager setViewMode={setViewMode} />
        </div>
      ) : viewMode === 'history' ? (
        <div className="admin-editors-fullpage" style={{ gridColumn: '1 / -1', gridRow: '2', padding: '40px', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
          <HistoryPanel setViewMode={setViewMode} />
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
                      className="admin-btn admin-btn-primary"
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
                        className="admin-btn admin-btn-primary"
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
                        className="admin-btn admin-btn-danger"
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
