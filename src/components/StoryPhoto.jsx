import Reveal from './Reveal';

export default function StoryPhoto({ src, alt, caption, rotate = '-2deg' }) {
  return (
    <Reveal className="photo-wrap">
      <figure className="polaroid" style={{ '--r': rotate }}>
        <div className="photo-frame">
          <img src={src} alt={alt} loading="lazy" decoding="async" />
        </div>
        <figcaption className="scribble">{caption}</figcaption>
      </figure>
    </Reveal>
  );
}
