
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Initial check
    const media = window.matchMedia(query);
    // Set initial value
    setMatches(media.matches);
    
    // Define listener function
    const listener = (e: MediaQueryListEvent) => {
      console.log(`Media query "${query}" changed to: ${e.matches}`);
      setMatches(e.matches);
    };
    
    // Modern approach for event listener
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Shorthand hooks for common device types
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

// Orientation hooks
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}
