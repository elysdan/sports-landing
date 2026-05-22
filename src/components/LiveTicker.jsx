import { useCMS } from '../context/CMSContext';

export default function LiveTicker() {
  const { data } = useCMS();
  const { ticker } = data;

  // Duplicate messages for seamless infinite scroll
  const allMessages = [...ticker.messages, ...ticker.messages];

  return (
    <div className="module-ticker animate-in animate-delay-5">
      {ticker.isLive && (
        <div className="ticker-live-badge">
          <span className="ticker-live-dot" />
          EN VIVO
        </div>
      )}
      <div className="ticker-content">
        <div className="ticker-scroll">
          {allMessages.map((msg, i) => (
            <span key={i}>
              <span className="ticker-text">{msg}</span>
              {i < allMessages.length - 1 && (
                <span className="ticker-separator">|</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
