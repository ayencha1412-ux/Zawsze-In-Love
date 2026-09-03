import { memo } from 'react';
import BlockHeart from './BlockHeart.jsx';

function FloatingHeartLayer({ variant = 'app' }) {
  return (
    <div className={`floating-heart-layer floating-heart-layer--${variant}`} aria-hidden="true">
      <span className="floating-block-heart float-heart-a"><BlockHeart size={10} /></span>
      <span className="floating-block-heart float-heart-b"><BlockHeart size={7} /></span>
      <span className="floating-block-heart float-heart-c"><BlockHeart size={12} /></span>
    </div>
  );
}

export default memo(FloatingHeartLayer);
