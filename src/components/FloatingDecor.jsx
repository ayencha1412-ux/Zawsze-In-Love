import { useMemo } from 'react';

export default function FloatingDecor() {
  const items = useMemo(() => {
    const icons = ['♡', '✿', '🪷'];
    return Array.from({ length: 15 }, (_, index) => ({
      id: index,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: `${Math.random() * 100}vw`,
      size: `${10 + Math.random() * 14}px`,
      duration: `${12 + Math.random() * 14}s`,
      delay: `${-Math.random() * 20}s`,
      dx: `${-80 + Math.random() * 160}px`,
    }));
  }, []);

  return (
    <div className="floating" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="floaty"
          style={{
            left: item.left,
            fontSize: item.size,
            animationDuration: item.duration,
            animationDelay: item.delay,
            '--dx': item.dx,
          }}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}
