import { useEffect, useRef } from 'react';

export default function useReveal(threshold = 0.12) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('show');
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('show');
        observer.unobserve(node);
      }
    }, { threshold });

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
