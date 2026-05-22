import { useCMS } from '../context/CMSContext';

export default function MatchResults() {
  const { data } = useCMS();
  const { matchResults } = data;

  return (
    <div className="module-results animate-in animate-delay-3">
      {/* Left: Results Table */}
      <div className="results-table">
        <div className="results-title">{matchResults.title}</div>
        {matchResults.matches.map((match, i) => (
          <div key={i}>
            <div className="result-row">
              <span className="result-team">{match.teamA}</span>
              <span className="result-score">{match.scoreA}</span>
            </div>
            <div className="result-row">
              <span className="result-team">{match.teamB}</span>
              <span className="result-score">{match.scoreB}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Featured Result */}
      <div className="results-featured">
        <div className="featured-card">
          <div className="featured-title">{matchResults.featured.title}</div>
          <div className="featured-title-big">PARTIDO</div>
          <div className="featured-teams">
            <span className="featured-flag">{matchResults.featured.flagA}</span>
            <span className="featured-team-name">{matchResults.featured.teamA}</span>
            <span className="featured-team-name" style={{ color: 'var(--color-text-muted)' }}>—</span>
            <span className="featured-team-name">{matchResults.featured.teamB}</span>
            <span className="featured-flag">{matchResults.featured.flagB}</span>
          </div>
          <div className="featured-scores">
            <span className="featured-score-value">{matchResults.featured.scoreA}</span>
            <span className="featured-score-value">{matchResults.featured.scoreB}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
