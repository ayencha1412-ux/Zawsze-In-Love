import { memo } from 'react';

const HEART_CELLS = [
  [2, 4],
  [1, 3], [2, 3], [3, 3],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
  [0, 0], [1, 0], [3, 0], [4, 0],
];

function BlockHeart({ size = 18, building = false, className = '' }) {
  return (
    <span
      className={`block-heart ${building ? 'is-building' : 'is-built'} ${className}`.trim()}
      style={{ '--heart-unit': `${size}px` }}
      aria-hidden="true"
    >
      {HEART_CELLS.map(([x, y], index) => (
        <span
          className="heart-block"
          key={`${x}-${y}`}
          style={{ '--x': x, '--y': y, '--i': index }}
        />
      ))}
    </span>
  );
}

export default memo(BlockHeart);
