import { useCMS } from '../context/CMSContext';

export default function NewsSection() {
  const { data } = useCMS();
  const { news } = data;

  return (
    <div className="module-news animate-in animate-delay-3">
      <div className="news-title">{news.title}</div>
      <div className="news-content">{news.content}</div>
    </div>
  );
}
