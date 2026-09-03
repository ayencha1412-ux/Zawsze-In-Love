import BlockHeart from './BlockHeart.jsx';

export default function TetrisHeartLoader({ label = 'Building this moment…', compact = false }) {
  return (
    <div className={`tetris-heart-loader ${compact ? 'is-compact' : ''}`} role="status" aria-live="polite">
      <div className="tetris-heart-stage">
        <BlockHeart size={compact ? 8 : 20} building />
        <span className="tetris-heart-shadow" aria-hidden="true" />
      </div>
      {label && <span className="tetris-heart-label">{label}</span>}
    </div>
  );
}
