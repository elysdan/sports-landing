import { useCMS } from '../context/CMSContext';

export default function HeroMedia() {
  const { data } = useCMS();
  const { heroMedia } = data;

  return (
    <div className="module-hero">
      {heroMedia.src ? (
        <>
          {heroMedia.type === 'video' ? (
            <video
              className="hero-media"
              src={heroMedia.src}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              className="hero-media"
              src={heroMedia.src}
              alt={heroMedia.alt}
            />
          )}
          <div className="hero-overlay" />
          <div className="hero-overlay-left" />
        </>
      ) : (
        <div className="hero-placeholder">
          <div className="hero-placeholder-icon">🏟️</div>
          <div>SUBE UNA IMAGEN O VIDEO DESDE EL CMS</div>
          <div style={{ fontSize: '13px', opacity: 0.5 }}>
            Haz clic en el botón ⚙️ para editar
          </div>
        </div>
      )}
    </div>
  );
}
