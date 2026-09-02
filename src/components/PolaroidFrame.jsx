export default function PolaroidFrame({ photo, index = 0, variant = 'landing', decorative = false }) {
  const number = (index % 3) + 1;

  return (
    <figure className={`memory-polaroid memory-polaroid--${variant} memory-polaroid--${number}`}>
      <span className={`polaroid-tape polaroid-tape--${number}`} aria-hidden="true" />

      <div className="polaroid-photo-wrap">
        <img
          src={photo.src}
          alt={decorative ? '' : photo.caption}
          decoding="async"
          loading={variant === 'landing' ? 'eager' : 'lazy'}
        />
        <span className="polaroid-photo-wash" aria-hidden="true" />
      </div>

      <figcaption className="polaroid-caption">
        <span>{photo.caption}</span>
        <small>{photo.note}</small>
      </figcaption>

      <span className="polaroid-corner-heart" aria-hidden="true">♡</span>
    </figure>
  );
}
