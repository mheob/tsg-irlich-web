'use client';

import { lazy, Suspense, useMemo, useSyncExternalStore } from 'react';

import { getBookStyle } from './book-size';
import type { FlipbookProps } from './flipbook';
import type { FlipbookPage } from './types';

// The library only reaches the browser, in its own chunk, on the issue page.
const Flipbook = lazy(async () => {
	const { Flipbook: component } = await import('./flipbook');
	return { default: component };
});

/** Nothing to undo, since nothing was subscribed. */
function unsubscribe(): void {
	// Nothing to undo.
}

/**
 * Nothing ever changes, so there is nothing to subscribe to.
 *
 * @returns The no-op unsubscribe.
 */
function subscribe(): () => void {
	return unsubscribe;
}

/**
 * The snapshot in the browser.
 *
 * @returns Always `true`.
 */
function isBrowser(): boolean {
	return true;
}

/**
 * The snapshot on the server and during hydration.
 *
 * @returns Always `false`.
 */
function isServer(): boolean {
	return false;
}

/**
 * The flipbook, loaded in the browser only. The server and the hydration pass render the cover in
 * the box the book will take, so nothing moves when the book arrives and a reader without
 * JavaScript still sees the issue. `next/dynamic` would do the loading too, but its placeholder
 * cannot receive the cover.
 *
 * @param props - The book's props and its cover.
 * @param props.cover - The first page, shown until the book has loaded.
 * @returns The cover, then the book.
 */
function FlipbookLazy({ cover, ...props }: Readonly<FlipbookLazyProps>) {
	const isClient = useSyncExternalStore(subscribe, isBrowser, isServer);
	const style = useMemo(
		() => getBookStyle(props.pageWidth, props.pageHeight),
		[props.pageHeight, props.pageWidth],
	);

	const placeholder = (
		<>
			{/* A spread starts with the cover alone on its right half, against the spine. */}
			<div className="flex aspect-(--echo-page) min-h-0 w-full justify-center @min-[480px]:aspect-(--echo-spread) @min-[480px]:justify-end">
				{cover && (
					<div className="aspect-(--echo-page) h-full">
						{/* The same CDN image the book shows first; see `flipbook.tsx` for why it is no `next/image`. */}
						{/* oxlint-disable-next-line nextjs/no-img-element -- see above */}
						<img
							alt={cover.alt}
							className="size-full object-contain"
							src={cover.src}
							srcSet={cover.srcSet}
						/>
					</div>
				)}
			</div>
			<div className="h-12" />
		</>
	);

	return (
		// The container query of the boxes follows this width, which is also the engine's. A spread
		// needs two of the narrowest pages plus the container's padding (32rem); below that the book
		// shows single pages, and their height decides how wide they may get.
		<div
			className="@container flex w-full max-w-(--echo-page-max) flex-col gap-6 min-[32rem]:max-w-(--echo-spread-max)"
			style={style}
		>
			{isClient ? (
				<Suspense fallback={placeholder}>
					<Flipbook {...props} />
				</Suspense>
			) : (
				placeholder
			)}
		</div>
	);
}

interface FlipbookLazyProps extends FlipbookProps {
	cover?: FlipbookPage;
}

export { FlipbookLazy };
