import { useCMS } from '../context/CMSContext';

export default function NextMatch() {
  const { data } = useCMS();
  const { nextMatch } = data;

  return (
    <div className="module-next-match animate-in animate-delay-2">
      <div className="next-match-label">{nextMatch.label}</div>
      <div className="next-match-odds">
        <div className="odds-card">
          <div className="odds-team-name">{nextMatch.teamA.name}</div>
          <div className="odds-value">{nextMatch.teamA.odds}</div>
        </div>
        <div className="odds-card">
          <div className="odds-team-name">VS.</div>
          <div className="odds-value">{nextMatch.draw.odds}</div>
          <div className="odds-draw-label">{nextMatch.draw.label}</div>
        </div>
        <div className="odds-card">
          <div className="odds-team-name">{nextMatch.teamB.name}</div>
          <div className="odds-value">{nextMatch.teamB.odds}</div>
        </div>
      </div>
    </div>
  );
}
