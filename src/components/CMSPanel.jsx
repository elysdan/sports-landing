import { useState, useCallback } from 'react';
import { useCMS } from '../context/CMSContext';
import MediaLibraryModal from './MediaLibraryModal';

const TABS = [
  { key: 'brand', label: 'Marca' },
  { key: 'score', label: 'Marcador' },
  { key: 'next', label: 'Siguiente' },
  { key: 'media', label: 'Media' },
  { key: 'news', label: 'Noticias' },
  { key: 'results', label: 'Resultados' },
  { key: 'upcoming', label: 'Próximo' },
  { key: 'ticker', label: 'Ticker' },
];

export default function CMSPanel() {
  const { data, updateSection, resetAll, cmsOpen, setCmsOpen } = useCMS();
  const [activeTab, setActiveTab] = useState('brand');
  
  // Estados para la Biblioteca de Medios
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaSelectCallback, setMediaSelectCallback] = useState(null);

  const handleImageUpload = useCallback(
    (section, field) => (e) => {
      const file = e.target.files[0];
      if (!file) return;
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
          .then((res) => res.json())
          .then((data) => {
            if (data.url) {
              updateSection(section, (prev) => ({
                ...prev,
                [field]: data.url,
                type: file.type.startsWith('video') ? 'video' : 'image',
              }));
            } else {
              console.error('Error al subir archivo:', data.error);
              alert('Error al subir el archivo: ' + (data.error || 'Desconocido'));
            }
          })
          .catch((err) => {
            console.error('Error de red al subir archivo:', err);
            alert('Error de red al intentar subir el archivo.');
          });
      };
      reader.readAsDataURL(file);
    },
    [updateSection]
  );

  const Field = ({ label, value, onChange, type = 'text', ...props }) => (
    <div className="cms-field">
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} {...props} />
      ) : (
        <input type={type} value={value} onChange={onChange} {...props} />
      )}
    </div>
  );

  const renderBrandTab = () => (
    <>
      <div className="cms-section-title">Marca / Logo</div>
      <Field
        label="Nombre de la marca"
        value={data.brand.name}
        onChange={(e) =>
          updateSection('brand', { ...data.brand, name: e.target.value })
        }
      />
    </>
  );

  const renderScoreTab = () => (
    <>
      <div className="cms-section-title">Marcador Principal</div>
      <div className="cms-field-row">
        <Field
          label="Equipo A - Nombre"
          value={data.mainScore.teamA.name}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamA: { ...data.mainScore.teamA, name: e.target.value },
            })
          }
        />
        <Field
          label="Equipo A - Código"
          value={data.mainScore.teamA.code}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamA: { ...data.mainScore.teamA, code: e.target.value },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Equipo A - Goles"
          type="number"
          value={data.mainScore.teamA.score}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamA: {
                ...data.mainScore.teamA,
                score: parseInt(e.target.value) || 0,
              },
            })
          }
        />
        <Field
          label="Equipo A - Bandera (emoji)"
          value={data.mainScore.teamA.flag}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamA: { ...data.mainScore.teamA, flag: e.target.value },
            })
          }
        />
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '16px 0' }} />

      <div className="cms-field-row">
        <Field
          label="Equipo B - Nombre"
          value={data.mainScore.teamB.name}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamB: { ...data.mainScore.teamB, name: e.target.value },
            })
          }
        />
        <Field
          label="Equipo B - Código"
          value={data.mainScore.teamB.code}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamB: { ...data.mainScore.teamB, code: e.target.value },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Equipo B - Goles"
          type="number"
          value={data.mainScore.teamB.score}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamB: {
                ...data.mainScore.teamB,
                score: parseInt(e.target.value) || 0,
              },
            })
          }
        />
        <Field
          label="Equipo B - Bandera (emoji)"
          value={data.mainScore.teamB.flag}
          onChange={(e) =>
            updateSection('mainScore', {
              ...data.mainScore,
              teamB: { ...data.mainScore.teamB, flag: e.target.value },
            })
          }
        />
      </div>
    </>
  );

  const renderNextTab = () => (
    <>
      <div className="cms-section-title">Siguiente Partido (Cuotas)</div>
      <Field
        label="Etiqueta"
        value={data.nextMatch.label}
        onChange={(e) =>
          updateSection('nextMatch', { ...data.nextMatch, label: e.target.value })
        }
      />
      <div className="cms-field-row">
        <Field
          label="Equipo A"
          value={data.nextMatch.teamA.name}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              teamA: { ...data.nextMatch.teamA, name: e.target.value },
            })
          }
        />
        <Field
          label="Cuota A"
          type="number"
          step="0.1"
          value={data.nextMatch.teamA.odds}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              teamA: {
                ...data.nextMatch.teamA,
                odds: parseFloat(e.target.value) || 0,
              },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Empate - Etiqueta"
          value={data.nextMatch.draw.label}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              draw: { ...data.nextMatch.draw, label: e.target.value },
            })
          }
        />
        <Field
          label="Cuota Empate"
          type="number"
          step="0.1"
          value={data.nextMatch.draw.odds}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              draw: {
                ...data.nextMatch.draw,
                odds: parseFloat(e.target.value) || 0,
              },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Equipo B"
          value={data.nextMatch.teamB.name}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              teamB: { ...data.nextMatch.teamB, name: e.target.value },
            })
          }
        />
        <Field
          label="Cuota B"
          type="number"
          step="0.1"
          value={data.nextMatch.teamB.odds}
          onChange={(e) =>
            updateSection('nextMatch', {
              ...data.nextMatch,
              teamB: {
                ...data.nextMatch.teamB,
                odds: parseFloat(e.target.value) || 0,
              },
            })
          }
        />
      </div>
    </>
  );

  const renderMediaTab = () => (
    <>
      <div className="cms-section-title">Media Principal</div>
      <div className="cms-field">
        <label>Subir imagen o video</label>
        <div className="cms-image-upload">
          <div className="cms-image-upload-icon">📁</div>
          <div className="cms-image-upload-text">
            Haz clic o arrastra una imagen/video aquí
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleImageUpload('heroMedia', 'src')}
          />
        </div>
        
        <button
          type="button"
          className="cms-ticker-add"
          style={{ width: '100%', marginTop: '8px', marginBottom: '8px', padding: '10px' }}
          onClick={() => {
            setMediaSelectCallback(() => (url, type) => {
              updateSection('heroMedia', (prev) => ({
                ...prev,
                src: url,
                type: type,
              }));
            });
            setMediaModalOpen(true);
          }}
        >
          🖼️ Seleccionar de Biblioteca
        </button>
        {data.heroMedia.src && (
          <>
            {data.heroMedia.type === 'video' ? (
              <video
                className="cms-image-preview"
                src={data.heroMedia.src}
                controls
                muted
                style={{ marginTop: '8px' }}
              />
            ) : (
              <img
                className="cms-image-preview"
                src={data.heroMedia.src}
                alt="Preview"
              />
            )}
            <button
              className="cms-ticker-remove"
              style={{ marginTop: '8px', width: '100%', height: 'auto', padding: '8px' }}
              onClick={() =>
                updateSection('heroMedia', {
                  ...data.heroMedia,
                  src: '',
                  type: 'image',
                })
              }
            >
              Eliminar media
            </button>
          </>
        )}
      </div>
      <Field
        label="Texto alternativo"
        value={data.heroMedia.alt}
        onChange={(e) =>
          updateSection('heroMedia', { ...data.heroMedia, alt: e.target.value })
        }
      />
    </>
  );

  const renderNewsTab = () => (
    <>
      <div className="cms-section-title">Noticias</div>
      <Field
        label="Título"
        value={data.news.title}
        onChange={(e) =>
          updateSection('news', { ...data.news, title: e.target.value })
        }
      />
      <Field
        label="Contenido"
        type="textarea"
        value={data.news.content}
        onChange={(e) =>
          updateSection('news', { ...data.news, content: e.target.value })
        }
      />
    </>
  );

  const renderResultsTab = () => (
    <>
      <div className="cms-section-title">Resultados de Partidos</div>
      <Field
        label="Título de la sección"
        value={data.matchResults.title}
        onChange={(e) =>
          updateSection('matchResults', {
            ...data.matchResults,
            title: e.target.value,
          })
        }
      />

      <div style={{ marginTop: '16px' }}>
        <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
          Partidos en la tabla
        </label>
        {data.matchResults.matches.map((match, i) => (
          <div className="cms-match-row" key={i}>
            <Field
              label={`Equipo A (#${i + 1})`}
              value={match.teamA}
              onChange={(e) => {
                const updated = [...data.matchResults.matches];
                updated[i] = { ...match, teamA: e.target.value };
                updateSection('matchResults', {
                  ...data.matchResults,
                  matches: updated,
                });
              }}
            />
            <div style={{ display: 'flex', gap: '4px', alignItems: 'end' }}>
              <Field
                label="G-A"
                type="number"
                value={match.scoreA}
                onChange={(e) => {
                  const updated = [...data.matchResults.matches];
                  updated[i] = {
                    ...match,
                    scoreA: parseInt(e.target.value) || 0,
                  };
                  updateSection('matchResults', {
                    ...data.matchResults,
                    matches: updated,
                  });
                }}
              />
              <Field
                label="G-B"
                type="number"
                value={match.scoreB}
                onChange={(e) => {
                  const updated = [...data.matchResults.matches];
                  updated[i] = {
                    ...match,
                    scoreB: parseInt(e.target.value) || 0,
                  };
                  updateSection('matchResults', {
                    ...data.matchResults,
                    matches: updated,
                  });
                }}
              />
            </div>
            <Field
              label={`Equipo B (#${i + 1})`}
              value={match.teamB}
              onChange={(e) => {
                const updated = [...data.matchResults.matches];
                updated[i] = { ...match, teamB: e.target.value };
                updateSection('matchResults', {
                  ...data.matchResults,
                  matches: updated,
                });
              }}
            />
          </div>
        ))}
        <button
          className="cms-ticker-add"
          onClick={() =>
            updateSection('matchResults', {
              ...data.matchResults,
              matches: [
                ...data.matchResults.matches,
                { teamA: 'EQUIPO A', teamB: 'EQUIPO B', scoreA: 0, scoreB: 0 },
              ],
            })
          }
        >
          + Agregar partido
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
      <div className="cms-section-title">Resultado Destacado</div>
      <div className="cms-field-row">
        <Field
          label="Equipo A"
          value={data.matchResults.featured.teamA}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                teamA: e.target.value,
              },
            })
          }
        />
        <Field
          label="Equipo B"
          value={data.matchResults.featured.teamB}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                teamB: e.target.value,
              },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Goles A"
          type="number"
          value={data.matchResults.featured.scoreA}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                scoreA: parseInt(e.target.value) || 0,
              },
            })
          }
        />
        <Field
          label="Goles B"
          type="number"
          value={data.matchResults.featured.scoreB}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                scoreB: parseInt(e.target.value) || 0,
              },
            })
          }
        />
      </div>
      <div className="cms-field-row">
        <Field
          label="Bandera A (emoji)"
          value={data.matchResults.featured.flagA}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                flagA: e.target.value,
              },
            })
          }
        />
        <Field
          label="Bandera B (emoji)"
          value={data.matchResults.featured.flagB}
          onChange={(e) =>
            updateSection('matchResults', {
              ...data.matchResults,
              featured: {
                ...data.matchResults.featured,
                flagB: e.target.value,
              },
            })
          }
        />
      </div>
    </>
  );

  const renderUpcomingTab = () => (
    <>
      <div className="cms-section-title">Próximo Partido</div>
      <Field
        label="Etiqueta"
        value={data.upcomingMatch.label}
        onChange={(e) =>
          updateSection('upcomingMatch', {
            ...data.upcomingMatch,
            label: e.target.value,
          })
        }
      />
      <Field
        label="Hora"
        value={data.upcomingMatch.time}
        onChange={(e) =>
          updateSection('upcomingMatch', {
            ...data.upcomingMatch,
            time: e.target.value,
          })
        }
      />
      <Field
        label="Equipo A"
        value={data.upcomingMatch.teamA}
        onChange={(e) =>
          updateSection('upcomingMatch', {
            ...data.upcomingMatch,
            teamA: e.target.value,
          })
        }
      />
      <Field
        label="Equipo B"
        value={data.upcomingMatch.teamB}
        onChange={(e) =>
          updateSection('upcomingMatch', {
            ...data.upcomingMatch,
            teamB: e.target.value,
          })
        }
      />
    </>
  );

  const renderTickerTab = () => (
    <>
      <div className="cms-section-title">Ticker en vivo</div>
      <div className="cms-field">
        <label>
          <input
            type="checkbox"
            checked={data.ticker.isLive}
            onChange={(e) =>
              updateSection('ticker', {
                ...data.ticker,
                isLive: e.target.checked,
              })
            }
            style={{ marginRight: '8px' }}
          />
          Mostrar badge "EN VIVO"
        </label>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
          Mensajes del ticker
        </label>
        {data.ticker.messages.map((msg, i) => (
          <div className="cms-ticker-item" key={i}>
            <input
              type="text"
              value={msg}
              onChange={(e) => {
                const updated = [...data.ticker.messages];
                updated[i] = e.target.value;
                updateSection('ticker', { ...data.ticker, messages: updated });
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-white)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            />
            <button
              className="cms-ticker-remove"
              onClick={() => {
                const updated = data.ticker.messages.filter((_, j) => j !== i);
                updateSection('ticker', { ...data.ticker, messages: updated });
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="cms-ticker-add"
          onClick={() =>
            updateSection('ticker', {
              ...data.ticker,
              messages: [...data.ticker.messages, 'Nuevo mensaje...'],
            })
          }
        >
          + Agregar mensaje
        </button>
      </div>
    </>
  );

  const tabContent = {
    brand: renderBrandTab,
    score: renderScoreTab,
    next: renderNextTab,
    media: renderMediaTab,
    news: renderNewsTab,
    results: renderResultsTab,
    upcoming: renderUpcomingTab,
    ticker: renderTickerTab,
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button className="cms-toggle-btn" onClick={() => setCmsOpen(true)} title="Abrir CMS">
        ⚙️
      </button>

      {/* Overlay */}
      <div
        className={`cms-overlay ${cmsOpen ? 'open' : ''}`}
        onClick={() => setCmsOpen(false)}
      />

      {/* Panel */}
      <div className={`cms-panel ${cmsOpen ? 'open' : ''}`}>
        <div className="cms-header">
          <span className="cms-header-title">CMS Editor</span>
          <button
            className="cms-close-btn"
            onClick={() => setCmsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="cms-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`cms-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cms-body">{tabContent[activeTab]?.()}</div>

        <div className="cms-footer">
          <button
            className="cms-btn cms-btn-danger"
            onClick={() => {
              if (window.confirm('¿Restablecer todo a los valores por defecto?')) {
                resetAll();
              }
            }}
          >
            Restablecer
          </button>
          <button
            className="cms-btn cms-btn-primary"
            onClick={() => setCmsOpen(false)}
          >
            Cerrar CMS
          </button>
        </div>
      </div>

      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={mediaSelectCallback}
      />
    </>
  );
}
