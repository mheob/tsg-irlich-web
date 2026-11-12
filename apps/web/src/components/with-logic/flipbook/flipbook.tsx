'use client';

import { HTMLFlipBook } from '@gullabs/react-flipbook';
import type { BookSnapshot, FlipBookHandle, PointerKind } from '@gullabs/react-flipbook';
import { ZoomIn } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { cn } from '@tsgi-web/shared';

import { ArrowButton } from '@/components/ui/arrow-button';
import { Toggle } from '@/components/ui/toggle';

import { MIN_PAGE_WIDTH } from './book-size';
import { describeSpread } from './describe-spread';
import { MagnifierLens } from './magnifier-lens';
import type { FlipbookPage } from './types';
import { useMagnifier } from './use-magnifier';

/** Mount only the spreads around the current one; a 52-page scan would otherwise load every page. */
const LAZY_RADIUS = 2;

/** No pointer turns a page while the lens follows it. */
const NO_POINTERS: readonly PointerKind[] = [];

/** A page is half the viewport next to its neighbour, the whole viewport on its own. */
const PAGE_SIZES = '(min-width: 48rem) 50vw, 100vw';

/**
 * A TSG-Echo issue to leaf through: a spread from `md` up, a single page on a phone. The book brings
 * keyboard turning and reduced motion; the buttons and the indicator below it are ours, because a
 * screen reader in browse mode never receives the arrow keys. The lens next to them enlarges the
 * page under the pointer; while it is on, only the buttons and the keyboard turn a page, so a click
 * or a drag meant for the lens cannot.
 *
 * @param props - The book's props.
 * @param props.label - The book's accessible name.
 * @param props.pageHeight - The height of a page in pixels.
 * @param props.pageWidth - The width of a page in pixels.
 * @param props.pages - The pages, cover first.
 * @returns The book with its controls.
 */
function Flipbook({ label, pageHeight, pageWidth, pages }: Readonly<FlipbookProps>) {
	const book = useRef<FlipBookHandle | null>(null);
	const [spread, setSpread] = useState<Spread>({ pageCount: pages.length, visiblePages: [0] });
	const magnifier = useMagnifier();

	// The engine tears the book down when its children change identity, so the leaves are built once.
	const leaves = useMemo(
		() =>
			pages.map((page) => (
				<div key={page.id}>
					<div className="size-full bg-white">
						{/* The Sanity CDN delivers every width; the Next.js optimizer would re-encode each page. */}
						{/* oxlint-disable-next-line nextjs/no-img-element -- see above */}
						<img
							alt={page.alt}
							className="size-full object-contain"
							decoding="async"
							loading="lazy"
							sizes={PAGE_SIZES}
							src={page.src}
							srcSet={page.srcSet}
						/>
					</div>
				</div>
			)),
		[pages],
	);

	const isAtStart = spread.visiblePages.includes(0);
	const isAtEnd = spread.visiblePages.includes(spread.pageCount - 1);

	const syncSpread = (snapshot: BookSnapshot): void => {
		setSpread({ pageCount: snapshot.pageCount, visiblePages: snapshot.visiblePages });
	};
	// Turning a phone swaps a spread for a single page without a page turn, so no `flip` follows.
	const syncOrientation = (): void => {
		const engine = book.current?.pageFlip();
		if (engine) {
			setSpread({ pageCount: engine.getPageCount(), visiblePages: engine.getVisiblePages() });
		}
	};
	// The buttons stay focusable at the ends: a disabled one would drop the keyboard focus.
	const showPrevious = (): void => {
		if (!isAtStart) {
			book.current?.flipPrev();
		}
	};
	const showNext = (): void => {
		if (!isAtEnd) {
			book.current?.flipNext();
		}
	};

	return (
		<>
			{/* The engine shows single pages below twice `MIN_PAGE_WIDTH`, so the box switches there. */}
			{/* A finger on the page moves the lens instead of the page while the lens is on. */}
			<div
				className={cn(
					'relative aspect-(--echo-page) w-full @min-[480px]:aspect-(--echo-spread)',
					magnifier.isOn && 'cursor-zoom-in touch-none',
					magnifier.lens !== undefined && 'cursor-none',
				)}
				{...magnifier.handlers}
			>
				<HTMLFlipBook
					aria-label={label}
					autoSize
					controls="none"
					hardCovers
					height={pageHeight}
					lazyRadius={LAZY_RADIUS}
					liveRegion={false}
					maxWidth={pageWidth}
					minWidth={MIN_PAGE_WIDTH}
					onChangeOrientation={syncOrientation}
					onLoaded={syncSpread}
					onPageChange={syncSpread}
					pointerInput={magnifier.isOn ? NO_POINTERS : undefined}
					ref={book}
					respectReducedMotion
					roleDescription="Heft"
					sizing="responsive"
					useKeyboard
					usePortrait
					width={pageWidth}
				>
					{leaves}
				</HTMLFlipBook>
				{magnifier.lens && <MagnifierLens lens={magnifier.lens} />}
			</div>
			{/* One row on a phone too, so the box the cover reserved for the controls still fits. */}
			<div className="relative flex h-12 items-center justify-center gap-4">
				<ArrowButton
					aria-disabled={isAtStart}
					aria-label="Vorherige Seite"
					direction="left"
					onClick={showPrevious}
					size="size-6"
					variant="ghost"
				/>
				<p aria-live="polite" className="min-w-40 text-center">
					{describeSpread(spread.visiblePages, spread.pageCount)}
				</p>
				<ArrowButton
					aria-disabled={isAtEnd}
					aria-label="Nächste Seite"
					direction="right"
					onClick={showNext}
					size="size-6"
					variant="secondary"
				/>
				<Toggle
					className="rounded-full sm:absolute sm:right-0"
					onPressedChange={magnifier.handleToggle}
					pressed={magnifier.isOn}
					size="lg"
					variant="outline"
				>
					<ZoomIn aria-hidden className="size-5" />
					<span className="max-sm:sr-only">Lupe</span>
				</Toggle>
			</div>
		</>
	);
}

interface FlipbookProps {
	/** The book's accessible name, e.g. `TSG ECHO 2025 zum Durchblättern`. */
	label: string;
	pageHeight: number;
	pageWidth: number;
	pages: readonly FlipbookPage[];
}

interface Spread {
	pageCount: number;
	visiblePages: number[];
}

export { Flipbook };
export type { FlipbookProps };
