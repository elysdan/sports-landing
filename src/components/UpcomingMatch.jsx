import { useCMS } from '../context/CMSContext';

export default function UpcomingMatch() {
  const { data } = useCMS();
  const { upcomingMatch } = data;

  return (
    <div className="module-upcoming animate-in animate-delay-4">
      <div className="upcoming-label">{upcomingMatch.label}</div>
      <div className="upcoming-time">{upcomingMatch.time}</div>
      <div className="upcoming-team">{upcomingMatch.teamA}</div>
      <div className="upcoming-team">{upcomingMatch.teamB}</div>
    </div>
  );
}
