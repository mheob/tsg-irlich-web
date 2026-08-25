import { vi } from 'vitest';

type MediaQueryListener = (event: MediaQueryListEvent) => void;

/**
 * Builds a `matchMedia` implementation whose `matches` value is fixed and whose listeners can be
 * triggered from a test through `dispatchMediaQueryChange`.
 *
 * Returns the same `MediaQueryList` instance for a given query string, so a hook that creates its
 * own list via `window.matchMedia(query)` and a test that fetches a list for the same query share
 * one listener set.
 *
 * @param matches - The fixed `matches` value every list produced by the stub reports.
 * @returns A `matchMedia` implementation to install with `vi.stubGlobal`.
 */
function createMatchMediaStub(matches: boolean): (query: string) => MediaQueryList {
	const lists = new Map<string, MediaQueryList>();

	return (query: string) => {
		const existing = lists.get(query);
		if (existing) {
			return existing;
		}

		const listeners = new Set<MediaQueryListener>();

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const list = {
			addEventListener: (_type: string, listener: MediaQueryListener) => {
				listeners.add(listener);
			},
			dispatchEvent: () => true,
			listeners,
			matches,
			media: query,
			onchange: null,
			removeEventListener: (_type: string, listener: MediaQueryListener) => {
				listeners.delete(listener);
			},
		} as unknown as MediaQueryList;

		lists.set(query, list);
		return list;
	};
}

/**
 * Fires a `change` event on every listener registered for the given media query list.
 *
 * @param list - The `MediaQueryList` (created by {@link createMatchMediaStub}) to dispatch on.
 * @param matches - The `matches` value to report on the dispatched event.
 */
function dispatchMediaQueryChange(list: MediaQueryList, matches: boolean): void {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const { listeners } = list as unknown as { listeners: Set<MediaQueryListener> };
	for (const listener of listeners) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		listener({ matches } as MediaQueryListEvent);
	}
}

class ObserverStub {
	public disconnect(): void {
		// no-op
	}

	public observe(): void {
		// no-op
	}

	public unobserve(): void {
		// no-op
	}
}

vi.stubGlobal('matchMedia', createMatchMediaStub(false));
vi.stubGlobal('ResizeObserver', ObserverStub);
vi.stubGlobal('IntersectionObserver', ObserverStub);

export { createMatchMediaStub, dispatchMediaQueryChange };
