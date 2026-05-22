import { useCMS } from '../context/CMSContext';

export default function MainScoreboard() {
  const { data } = useCMS();
  const { mainScore } = data;

  return (
    <div className="module-scoreboard animate-in animate-delay-1">
      <div className="scoreboard-main">
        <div className="scoreboard-team">
          <span className="scoreboard-team-flag">{mainScore.teamA.flag}</span>
          <div className="scoreboard-team-label">{mainScore.teamA.name}</div>
          <div className="scoreboard-team-code">{mainScore.teamA.code}</div>
        </div>

        <div className="scoreboard-score">{mainScore.teamA.score}</div>
        <div className="scoreboard-divider">-</div>
        <div className="scoreboard-score">{mainScore.teamB.score}</div>

        <div className="scoreboard-team">
          <span className="scoreboard-team-flag">{mainScore.teamB.flag}</span>
          <div className="scoreboard-team-label">{mainScore.teamB.name}</div>
          <div className="scoreboard-team-code">{mainScore.teamB.code}</div>
        </div>
      </div>
    </div>
  );
}
