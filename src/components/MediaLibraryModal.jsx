import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './MediaLibrary.css';

// Convert size in bytes to readable format
const formatBytes = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function MediaLibraryModal({ isOpen, onClose, onSelect }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'image', 'video'
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isDragging, setIsDragging] = useState(false);
  
  const toastTimeoutRef = useRef(null);

  // Fetch media files from local server
  const fetchMedia = useCallback(() => {
    setLoading(true);
    fetch('/api/media')
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los medios');
        return res.json();
      })
      .then((data) => {
        setMediaList(data || []);
      })
      .catch((err) => {
        console.error('Error fetching media:', err);
        showToast('Error al cargar la biblioteca de medios.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Fetch media list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedItem(null);
    }
  }, [isOpen, fetchMedia]);

  // Clean up toast timeout
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Show copy URL or action toast
  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  };

  // Upload file utility
  const uploadFile = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Solo se admiten formatos de imagen o video.');
      return;
    }

    setUploading(true);
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
        .then((res) => {
          if (!res.ok) throw new Error('Fallo en la subida');
          return res.json();
        })
        .then((data) => {
          if (data.url) {
            showToast('Archivo subido con éxito.');
            fetchMedia();
          } else {
            console.error('Error del servidor:', data.error);
            alert('Error al subir el archivo: ' + (data.error || 'Desconocido'));
          }
        })
        .catch((err) => {
          console.error('Error de red al subir:', err);
          alert('Error de red al intentar subir el archivo.');
        })
        .finally(() => {
          setUploading(false);
        });
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // Copy relative URL to clipboard
  const handleCopyUrl = (e, url) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('¡Enlace copiado al portapapeles!');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        showToast('Error al copiar enlace.');
      });
  };

  // Delete dynamic media file
  const handleDeleteMedia = (e, url, name) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el archivo "${name}" de tu biblioteca?`)) {
      return;
    }

    fetch(`/api/media?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast('Archivo eliminado de la biblioteca.');
          if (selectedItem?.url === url) {
            setSelectedItem(null);
          }
          fetchMedia();
        } else {
          alert('Error al eliminar: ' + (data.error || 'Desconocido'));
        }
      })
      .catch((err) => {
        console.error('Error deleting media:', err);
        alert('Error de red al intentar eliminar el archivo.');
      });
  };

  // Double click select
  const handleDoubleClickItem = (item) => {
    if (onSelect) {
      onSelect(item.url, item.type);
      onClose();
    }
  };

  // Handle select insert from footer
  const handleInsertSelected = () => {
    if (selectedItem && onSelect) {
      onSelect(selectedItem.url, selectedItem.type);
      onClose();
    }
  };

  // Filter and search logic (memorizado)
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesSearch = item.filename.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' ? true : item.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [mediaList, search, filter]);

  if (!isOpen) return null;

  return (
    <div className="media-library-overlay" onClick={onClose}>
      <div className="media-library-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="media-library-header">
          <div className="media-library-title">
            <span>🖼️</span> Biblioteca de Medios
          </div>
          <button className="media-library-close-btn" onClick={onClose} title="Cerrar modal">
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div className="media-library-body">
          
          {/* Upload Area */}
          <div 
            className={`media-library-upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="media-library-upload-loader">
                <span className="media-library-spinner"></span>
                <span>Subiendo archivo multimedia...</span>
              </div>
            ) : (
              <>
                <span className="media-library-upload-icon">📁</span>
                <span className="media-library-upload-text">
                  Arrastra un archivo aquí o haz clic para subir
                </span>
                <span className="media-library-upload-subtext">
                  Soporta: JPG, PNG, GIF, WEBP, SVG, MP4, WEBM
                </span>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/webm,.gif" 
                  onChange={handleFileInput} 
                />
              </>
            )}
          </div>

          {/* Toolbar: Search and filters */}
          <div className="media-library-toolbar">
            <div className="media-library-search">
              <input 
                type="text" 
                placeholder="Buscar por nombre de archivo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="media-library-filters">
              <button 
                type="button"
                className={`media-library-filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todos
              </button>
              <button 
                type="button"
                className={`media-library-filter-btn ${filter === 'image' ? 'active' : ''}`}
                onClick={() => setFilter('image')}
              >
                Imágenes
              </button>
              <button 
                type="button"
                className={`media-library-filter-btn ${filter === 'video' ? 'active' : ''}`}
                onClick={() => setFilter('video')}
              >
                Videos
              </button>
            </div>
          </div>

          {/* Grid Container */}
          <div className="media-library-grid-container">
            {loading ? (
              <div className="media-library-empty">
                <span className="media-library-spinner"></span>
                <span className="media-library-empty-title">Cargando archivos multimedia...</span>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="media-library-empty">
                <span className="media-library-empty-icon">📁</span>
                <span className="media-library-empty-title">
                  {search ? 'No se encontraron archivos que coincidan con la búsqueda.' : 'No hay archivos multimedia cargados todavía.'}
                </span>
              </div>
            ) : (
              <div className="media-library-grid">
                {filteredMedia.map((item) => {
                  const isSelected = selectedItem?.url === item.url;
                  const isUploaded = item.url.startsWith('/update/');
                  
                  return (
                    <div 
                      key={item.url}
                      className={`media-library-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => handleDoubleClickItem(item)}
                    >
                      {/* Thumbnail wrapper */}
                      <div className="media-library-thumbnail-wrapper">
                        {item.type === 'video' ? (
                          <>
                            <video 
                              src={item.url} 
                              className="media-library-thumbnail" 
                              muted
                              preload="metadata"
                            />
                            <span className="media-library-video-icon-badge">▶</span>
                          </>
                        ) : (
                          <img 
                            src={item.url} 
                            alt={item.filename}
                            className="media-library-thumbnail"
                            loading="lazy"
                          />
                        )}
                        
                        <span className="media-library-source-badge">
                          {isUploaded ? 'Subido' : 'Sistema'}
                        </span>

                        {/* Hover Overlay Actions */}
                        <div className="media-library-item-overlay">
                          {onSelect && (
                            <button 
                              type="button"
                              className="media-library-action-btn media-library-btn-select"
                              onClick={() => {
                                onSelect(item.url, item.type);
                                onClose();
                              }}
                            >
                              Seleccionar
                            </button>
                          )}
                          <button 
                            type="button"
                            className="media-library-action-btn media-library-btn-copy"
                            onClick={(e) => handleCopyUrl(e, item.url)}
                          >
                            Copiar URL
                          </button>
                          {isUploaded && (
                            <button 
                              type="button"
                              className="media-library-action-btn media-library-btn-delete"
                              onClick={(e) => handleDeleteMedia(e, item.url, item.filename)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* File details footer inside item */}
                      <div className="media-library-item-info">
                        <span className="media-library-item-name" title={item.filename}>
                          {item.filename}
                        </span>
                        <div className="media-library-item-meta">
                          <span>{item.type === 'video' ? 'Video' : 'Imagen'}</span>
                          <span>{formatBytes(item.size)}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="media-library-footer">
          <div className="media-library-selection-info">
            {selectedItem ? (
              <>
                Seleccionado: <span>{selectedItem.filename}</span> ({formatBytes(selectedItem.size)})
              </>
            ) : (
              'Ningún archivo seleccionado'
            )}
          </div>
          <div className="media-library-footer-actions">
            <button 
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm" 
              onClick={onClose}
            >
              Cancelar
            </button>
            {onSelect && (
              <button 
                type="button"
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={handleInsertSelected}
                disabled={!selectedItem}
              >
                Insertar Medio
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      <div className={`media-library-toast ${toast.show ? 'show' : ''}`}>
        <span>ℹ️</span> {toast.message}
      </div>

    </div>
  );
}
