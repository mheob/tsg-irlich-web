import { vi } from 'vitest';

type MediaQueryListener = (event: MediaQueryListEvent) => void;

interface MutableMediaQueryList {
	listeners: Set<MediaQueryListener>;
	matches: boolean;
}

/**
 * Builds a `matchMedia` implementation whose `matches` value is fixed and whose listeners can be
 * triggered from a test through `dispatchMediaQueryChange`.
 *
 * Returns the same `MediaQueryList` instance for a given query string, so a hook that creates its
 * own list via `window.matchMedia(query)` and a test that fetches a list for the same query share
 * one listener set.
 *
 * @param matches - The initial `matches` value the list reports before any dispatched change.
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
 * Fires a `change` event on every listener registered for the given media query list, after
 * updating the list's own `matches` property so the stub and the dispatched event agree.
 *
 * @param list - The `MediaQueryList` (created by {@link createMatchMediaStub}) to dispatch on.
 * @param matches - The `matches` value to set on the list and to report on the dispatched event.
 */
function dispatchMediaQueryChange(list: MediaQueryList, matches: boolean): void {
	const mutableList = list as unknown as MutableMediaQueryList;
	mutableList.matches = matches;

	for (const listener of mutableList.listeners) {
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

// jsdom implements neither the pointer-capture API nor `scrollIntoView`, both of which Radix's
// primitives (Select, Dialog, the vaul drawer) touch on mount — stub them so a test fails on the
// component under test, not on an unrelated jsdom gap.
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {
	// no-op
};
Element.prototype.releasePointerCapture = () => {
	// no-op
};
Element.prototype.scrollIntoView = () => {
	// no-op
};

export { createMatchMediaStub, dispatchMediaQueryChange };
