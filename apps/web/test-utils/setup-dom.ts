import { createElement, Fragment, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
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

// --- next/image --------------------------------------------------------------------------------

interface StaticImageStub {
	blurDataURL?: string;
	blurWidth?: number;
	height: number;
	src: string;
	width: number;
}

interface NextImageMockProps {
	alt: string;
	className?: string;
	height?: number | string;
	src: StaticImageStub | string;
	width?: number | string;
}

/**
 * Stands in for `next/image`'s `Image`: a plain `<img>` forwarding the props a test can query or
 * assert on (`src`, `alt`, `width`, `height`, `className`) and silently dropping the Next-only ones
 * (`fill`, `preload`, `quality`, `sizes`, `loader`, `placeholder`, `blurDataURL`, …) that would
 * otherwise land on the DOM node and trigger a React "unknown prop" warning. `alt` is forwarded
 * verbatim, so a test can query the image by its accessible name.
 *
 * A static image import resolves, through the `assetStub` Vite plugin in `vitest.config.ts`, to a
 * `StaticImageStub` object rather than a string — its `src` field is used as the `<img>` `src` in
 * that case.
 *
 * Escape hatch: this mock carries no per-test state, so a test that needs different `next/image`
 * behaviour overrides the whole module itself with its own `vi.mock('next/image', () => ({...}))`
 * — a mock declared in a test file is registered after this one and wins for that file. Nothing to
 * reset between tests.
 *
 * @param props - The props `next/image`'s `Image` was rendered with.
 * @param props.alt - Forwarded verbatim to the `<img>`.
 * @param props.className - Forwarded verbatim to the `<img>`.
 * @param props.height - Forwarded verbatim to the `<img>`.
 * @param props.src - A URL, or the `assetStub` object a static import resolves to.
 * @param props.width - Forwarded verbatim to the `<img>`.
 * @returns The `<img>` standing in for `next/image`'s `Image`.
 */
function NextImageMock({ alt, className, height, src, width }: NextImageMockProps): ReactElement {
	const resolvedSrc = typeof src === 'string' ? src : src.src;
	return createElement('img', { alt, className, height, src: resolvedSrc, width });
}

vi.mock('next/image', () => ({ default: NextImageMock }));

// --- next/navigation -----------------------------------------------------------------------------

let currentPathname = '/';

/**
 * Escape hatch for a test that needs `usePathname()` to resolve to a specific route. Call before
 * rendering. `currentPathname` is module state shared by every test in the run, so a test that
 * changes it must set it back (for example to `'/'`) in an `afterEach`, or a later test silently
 * inherits it.
 *
 * @param pathname - The value `usePathname()` resolves to from now on.
 */
function setPathname(pathname: string): void {
	currentPathname = pathname;
}

/**
 * Escape hatch for a test that needs to assert on, or configure the result of, a navigation call.
 * `useRouter()` always returns this same object, so a call made through a router obtained on one
 * render is still visible on `routerMock` after a re-render.
 *
 * These `vi.fn()`s are not created inside the `vi.mock(...)` factory below, but the same rule from
 * `apps/web/AGENTS.md` still applies to them: neither `vi.resetModules()` nor `vi.restoreAllMocks()`
 * clears a plain `vi.fn()`'s call history or implementation — only `vi.spyOn` registrations are.
 * Call `.mockReset()` on whichever of `push`/`replace`/`back`/`prefetch` a test used, in that
 * test's `afterEach`.
 */
const routerMock = {
	back: vi.fn(),
	prefetch: vi.fn(),
	push: vi.fn(),
	replace: vi.fn(),
};

vi.mock('next/navigation', () => ({
	usePathname: () => currentPathname,
	useRouter: () => routerMock,
}));

// --- motion/react --------------------------------------------------------------------------------

/**
 * Prop names that only mean something to a `motion` component (animation, gesture and layout
 * props) and are dropped before reaching the plain DOM tag, so React never warns about an unknown
 * attribute. Anything not in this set — ordinary DOM/React props such as `className`, `onClick` or
 * `children` included — is forwarded untouched.
 */
const MOTION_ONLY_PROPS = new Set([
	'animate',
	'custom',
	'drag',
	'dragConstraints',
	'dragElastic',
	'dragMomentum',
	'dragPropagation',
	'dragSnapToOrigin',
	'dragTransition',
	'exit',
	'initial',
	'layout',
	'layoutDependency',
	'layoutId',
	'layoutScroll',
	'onAnimationComplete',
	'onAnimationStart',
	'onDirectionLock',
	'onDrag',
	'onDragEnd',
	'onDragStart',
	'onLayoutAnimationComplete',
	'onLayoutAnimationStart',
	'onPan',
	'onPanEnd',
	'onPanSessionStart',
	'onPanStart',
	'onUpdate',
	'onViewportEnter',
	'onViewportLeave',
	'transformTemplate',
	'transformValues',
	'transition',
	'variants',
	'viewport',
	'whileDrag',
	'whileFocus',
	'whileHover',
	'whileInView',
	'whileTap',
]);

const motionComponentCache = new Map<string, (props: Record<string, unknown>) => ReactElement>();

/**
 * Builds (and caches, per tag) the plain-tag stand-in for `motion.<tag>`. Caching keeps the
 * component's identity stable across renders — a fresh function on every access of `motion.div`
 * would make React remount the element on every render of whatever reads it.
 *
 * @param tag - The DOM tag name `motion.<tag>` was accessed as, for example `'div'`.
 * @returns A component rendering `tag`, forwarding every prop except {@link MOTION_ONLY_PROPS}.
 */
function getMotionComponent(tag: string): (props: Record<string, unknown>) => ReactElement {
	const cached = motionComponentCache.get(tag);
	if (cached) {
		return cached;
	}

	/**
	 * @param props - The props the `motion.<tag>` element was rendered with.
	 * @returns The plain `tag` element, with {@link MOTION_ONLY_PROPS} stripped from `props`.
	 */
	function MotionComponentMock(props: Record<string, unknown>): ReactElement {
		const domProps: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(props)) {
			if (!MOTION_ONLY_PROPS.has(key)) {
				domProps[key] = value;
			}
		}
		return createElement(tag, domProps);
	}

	motionComponentCache.set(tag, MotionComponentMock);
	return MotionComponentMock;
}

/**
 * Stands in for `motion`: `motion.div`, `motion.button`, any tag, all resolve to the plain DOM tag
 * via {@link getMotionComponent}. Escape hatch: like `next/image`, a test file that needs different
 * `motion` behaviour re-mocks the module itself; nothing here carries state to reset.
 */
const motionMock = new Proxy(
	{},
	{ get: (_target, tag) => getMotionComponent(String(tag)) },
) as Record<string, (props: Record<string, unknown>) => ReactElement>;

/**
 * Stands in for `AnimatePresence`: renders its children directly with no exit-animation wrapper, so
 * an element that would be exiting in the real component simply leaves the tree immediately.
 *
 * @param props - The props `AnimatePresence` was rendered with.
 * @param props.children - The element(s) to render, unwrapped.
 * @returns `children`, wrapped in nothing more than a `Fragment`.
 */
function AnimatePresenceMock({ children }: { children?: ReactNode }): ReactElement {
	return createElement(Fragment, null, children);
}

let reducedMotion = true;

/**
 * Escape hatch for a test that needs the non-reduced-motion branch. Shared module state like
 * `currentPathname` above — reset it (back to `true`) in an `afterEach` once a test changes it.
 *
 * @param value - The value `useReducedMotion()` resolves to from now on.
 */
function setReducedMotion(value: boolean): void {
	reducedMotion = value;
}

let inView = true;

/**
 * Escape hatch for a test that needs `useInView` to report an element as not yet visible (for
 * example, to assert a `NumberTicker` has not started counting). Shared module state — reset it
 * (back to `true`) in an `afterEach` once a test changes it.
 *
 * @param value - The value `useInView()` resolves to from now on.
 */
function setInView(value: boolean): void {
	inView = value;
}

interface MotionValueMock<T> {
	get: () => T;
	on: (event: 'change', callback: (value: T) => void) => () => void;
	set: (value: T) => void;
}

function createMotionValueMock<T>(initial: T): MotionValueMock<T> {
	let current = initial;
	const listeners = new Set<(value: T) => void>();

	return {
		get: () => current,
		// The `event` argument is intentionally unused: `on`'s type only ever admits `'change'`,
		// which is the only event `number-ticker.tsx` subscribes to.
		on: (_event, callback) => {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
		set: (value) => {
			current = value;
			for (const listener of listeners) {
				listener(value);
			}
		},
	};
}

/**
 * Stands in for `useMotionValue`. Persists the created value across re-renders with `useRef` —
 * matching the real hook, which only honours its argument on the very first call — so a `.set()`
 * from an effect still reaches listeners subscribed on a later render.
 *
 * @param initial - The value to seed the motion value with on the first render.
 * @returns The (per-component-instance, stable) motion value.
 */
function useMotionValueMock<T>(initial: T): MotionValueMock<T> {
	const reference = useRef<MotionValueMock<T> | null>(null);
	reference.current ??= createMotionValueMock(initial);
	return reference.current;
}

/**
 * Stands in for `useSpring`. This does not reproduce spring physics: instead of easing toward the
 * source value over a sequence of animation frames, it forwards `source`'s value to its own
 * listeners the instant `source` changes. `number-ticker.tsx`'s displayed start and end values are
 * therefore correct, but the eased intermediate values a real spring would emit between them are
 * not — a test that renders a `NumberTicker` observes the final digits appear, not a count-up.
 *
 * @param source - The motion value this spring tracks.
 * @returns The (per-component-instance, stable) spring-tracking motion value.
 */
function useSpringMock<T>(source: MotionValueMock<T>): MotionValueMock<T> {
	const reference = useRef<MotionValueMock<T> | null>(null);
	if (!reference.current) {
		const spring = createMotionValueMock(source.get());
		source.on('change', (value) => {
			spring.set(value);
		});
		reference.current = spring;
	}
	return reference.current;
}

vi.mock('motion/react', () => ({
	AnimatePresence: AnimatePresenceMock,
	motion: motionMock,
	useInView: () => inView,
	useMotionValue: useMotionValueMock,
	useReducedMotion: () => reducedMotion,
	useSpring: useSpringMock,
}));

export {
	createMatchMediaStub,
	dispatchMediaQueryChange,
	routerMock,
	setInView,
	setPathname,
	setReducedMotion,
};
