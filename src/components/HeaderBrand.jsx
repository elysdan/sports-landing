import { useCMS } from '../context/CMSContext';

export default function HeaderBrand() {
  const { data } = useCMS();
  const { brand } = data;

  return (
    <div className="module-brand">
      <div className="brand-icon">♣</div>
      <div className="brand-name">
        <span>mi</span>{brand.name.replace(/^mi/i, '') || 'Casino'}
      </div>
    </div>
  );
}
