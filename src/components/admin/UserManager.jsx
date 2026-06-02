import { useState, useEffect } from 'react';
import { useCMS, MODULE_TYPES } from '../../context/CMSContext';

export default function UserManager() {
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
    
    const isApprove = u.allowedTypes.includes('approve') || u.allowedTypes.includes('*');
    const isDelete = u.allowedTypes.includes('delete_media') || u.allowedTypes.includes('*');
    const isReadonly = u.allowedTypes.includes('readonly_media_add');

    setCanApprovePermission(isApprove);
    setCanDeleteMediaPermission(isDelete);
    setReadonlyMediaAddSelected(isReadonly);

    if (u.allowedTypes.includes('*')) {
      setAllSelected(true);
      setSelectedTypes(Object.keys(MODULE_TYPES));
    } else if (isReadonly) {
      setAllSelected(false);
      setSelectedTypes([]);
    } else {
      setAllSelected(false);
      setSelectedTypes(u.allowedTypes.filter(t => t !== 'approve' && t !== 'delete_media'));
    }
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
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedTypes([]);
      setAllSelected(false);
    } else {
      setSelectedTypes(Object.keys(MODULE_TYPES));
      setAllSelected(true);
      setReadonlyMediaAddSelected(false); // Can't be readonly if all modules allowed
    }
  };

  const toggleType = (key) => {
    if (readonlyMediaAddSelected) return; // Cannot select modules if readonly_media_add is selected
    if (selectedTypes.includes(key)) {
      setSelectedTypes(prev => prev.filter(t => t !== key));
      setAllSelected(false);
    } else {
      const nextSelected = [...selectedTypes, key];
      setSelectedTypes(nextSelected);
      if (nextSelected.length === Object.keys(MODULE_TYPES).length) {
        setAllSelected(true);
      }
    }
  };

  const toggleReadonlyMediaAdd = () => {
    if (!readonlyMediaAddSelected) {
      // Clear all other selections since readonly_media_add is mutually exclusive
      setSelectedTypes([]);
      setAllSelected(false);
      setCanApprovePermission(false);
      setCanDeleteMediaPermission(false);
      setReadonlyMediaAddSelected(true);
    } else {
      setReadonlyMediaAddSelected(false);
    }
  };

  const handleDelete = async (username) => {
    if (username.toLowerCase() === 'admin') {
      alert('No se puede eliminar el usuario administrador principal.');
      return;
    }

    if (window.confirm(`¿Seguro que deseas eliminar al usuario "${username}" permanentemente?`)) {
      const success = await deleteEditor(username);
      if (success) {
        setFeedback({ type: 'success', message: `Usuario "${username}" eliminado con éxito.` });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: 'No se pudo eliminar el usuario.' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uName = usernameInput.trim();
    const uPass = passwordInput.trim();
    const uRealName = name.trim();

    if (!uName || !uRealName || (!editingUsername && !uPass)) {
      setFeedback({ type: 'error', message: 'Por favor, rellena todos los campos requeridos.' });
      return;
    }

    // Prepare permissions
    let finalAllowed = [];
    if (readonlyMediaAddSelected) {
      finalAllowed = ['readonly_media_add'];
    } else if (allSelected) {
      finalAllowed.push('*');
      if (canApprovePermission) finalAllowed.push('approve');
      if (canDeleteMediaPermission) finalAllowed.push('delete_media');
    } else {
      finalAllowed = [...selectedTypes];
      if (canApprovePermission) finalAllowed.push('approve');
      if (canDeleteMediaPermission) finalAllowed.push('delete_media');
    }

    const success = await createEditor(uName, uPass, uRealName, finalAllowed);

    if (success) {
      setFeedback({ 
        type: 'success', 
        message: editingUsername 
          ? `Usuario "${uName}" actualizado correctamente.` 
          : `Usuario "${uName}" creado correctamente.` 
      });
      handleCancelEdit();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: 'Error al procesar la solicitud en el servidor.' });
    }
  };

  const formatPermissions = (allowed) => {
    if (allowed.includes('*')) {
      const extras = [];
      if (allowed.includes('approve')) extras.push('Aprobador');
      if (allowed.includes('delete_media')) extras.push('Borrar multimedia');
      return `Total (*)${extras.length > 0 ? ` + [${extras.join(', ')}]` : ''}`;
    }
    if (allowed.includes('readonly_media_add')) {
      return 'Galería (Solo Subir)';
    }

    const labels = allowed.map(t => {
      if (t === 'approve') return 'Aprobar';
      if (t === 'delete_media') return 'Borrar multimedia';
      return MODULE_TYPES[t]?.label || t;
    });

    return labels.length > 0 ? labels.join(', ') : 'Ninguno';
  };

  return (
    <div className="editors-mgmt-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '2fr 1.2fr',
      gap: '32px',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-white)'
    }}>
      {/* List Panel */}
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
          <span>👥</span> Usuarios y Roles del CMS
        </h2>

        {feedback && (
          <div style={{
            background: feedback.type === 'success' ? 'rgba(56, 161, 105, 0.12)' : 'rgba(229, 62, 62, 0.12)',
            border: feedback.type === 'success' ? '1px solid rgba(56, 161, 105, 0.3)' : '1px solid rgba(229, 62, 62, 0.3)',
            color: feedback.type === 'success' ? '#48bb78' : '#feb2b2',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}>
            {feedback.message}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-white)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Nombre de Usuario</th>
                <th style={{ padding: '12px 16px' }}>Permisos / Alcance</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.username} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--color-white)' }}>{u.name}</td>
                  <td style={{ padding: '16px', fontFamily: 'monospace' }}>{u.username}</td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>{formatPermissions(u.allowedTypes)}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleEditClick(u)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        ✏️ Editar
                      </button>
                      {u.username.toLowerCase() !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.username)}
                          className="admin-btn admin-btn-sm"
                          style={{ background: 'rgba(229, 62, 62, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(229, 62, 62, 0.2)' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Panel */}
      <div className="editors-create-panel" style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        alignSelf: 'start'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          letterSpacing: '0.5px',
          color: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          margin: '0 0 20px 0',
          textTransform: 'uppercase'
        }}>
          {editingUsername ? '📝 Editar Usuario' : '➕ Crear Usuario'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
              Nombre Real
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
              Nombre de Usuario (Login)
            </label>
            <input
              type="text"
              placeholder="Ej. jperez"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              disabled={!!editingUsername}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-white)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                opacity: editingUsername ? 0.6 : 1
              }}
            />
          </div>

          <div className="field">
            <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
              Contraseña {editingUsername && '(Dejar vacío para conservar)'}
            </label>
            <input
              type="password"
              placeholder={editingUsername ? "••••••••" : "Introduce contraseña"}
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

          <div className="permissions-section" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-white)', margin: '0 0 12px 0', fontWeight: 'bold' }}>
              Asignación de Permisos:
            </h3>

            {/* Readonly Media Add Option */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
              <input
                type="checkbox"
                id="readonly_media_add"
                checked={readonlyMediaAddSelected}
                onChange={toggleReadonlyMediaAdd}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="readonly_media_add" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--color-white)', fontWeight: 'bold' }}>
                📷 Usuario de Galería (Solo Subir Multimedia)
              </label>
            </div>

            <div style={{ opacity: readonlyMediaAddSelected ? 0.4 : 1, pointerEvents: readonlyMediaAddSelected ? 'none' : 'auto' }}>
              {/* Approve permission */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="perm_approve"
                  checked={canApprovePermission}
                  onChange={(e) => setCanApprovePermission(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="perm_approve" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--color-success)' }}>
                  ✅ Habilitar Aprobación (Publicación Live)
                </label>
              </div>

              {/* Delete media permission */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="perm_delete_media"
                  checked={canDeleteMediaPermission}
                  onChange={(e) => setCanDeleteMediaPermission(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="perm_delete_media" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}>
                  🗑️ Permitir borrar archivos de la Galería
                </label>
              </div>

              {/* Module selection */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Módulos permitidos:</span>
                <button
                  type="button"
                  onClick={toggleAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-gold)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {allSelected ? '🚫 Deseleccionar todos' : 'Select todo (*)'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {Object.keys(MODULE_TYPES).map((key) => {
                  const typeInfo = MODULE_TYPES[key];
                  const isChecked = selectedTypes.includes(key);

                  return (
                    <div
                      key={key}
                      onClick={() => toggleType(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: isChecked ? 'rgba(212, 168, 67, 0.08)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${isChecked ? 'rgba(212, 168, 67, 0.3)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
    </div>
  );
}
