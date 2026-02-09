import { useState, useEffect } from 'react'

/**
 * Hook to detect if the viewport is below a given breakpoint.
 * Defaults to 640px (Tailwind `sm` breakpoint).
 */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}
