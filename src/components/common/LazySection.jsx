'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * LazySection - Loads children only when visible (Intersection Observer)
 * Perfect for mobile performance optimization
 */
export default function LazySection({ 
  children, 
  minHeight = '400px',
  rootMargin = '200px', // Start loading 200px before visible
  placeholder = null 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : (placeholder || <div style={{ minHeight }} />)}
    </div>
  );
}
