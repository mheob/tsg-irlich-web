/* eslint-disable unicorn/prefer-global-this */

import { useEffect, useState } from 'react';

/**
 * A React hook that listens to media query changes and returns whether the query matches.
 *
 * @param query - A media query string (e.g. '(max-width: 48rem)')
 * @returns A boolean indicating whether the media query matches
 *
 * @example
 * ```tsx
 * // Basic usage
 * const isMobile = useMediaQuery('(max-width: 48rem)');
 *
 * // Multiple queries
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * // Use in conditional rendering
 * {isMobile ? <MobileNav /> : <DesktopNav />}
 * ```
 */
export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia(query);

		setMatches(mediaQuery.matches);

		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}, [query]);

	return matches;
}
