import { cn } from '@tsgi-web/shared';

import type { Lens } from './use-magnifier';

/**
 * The lens that shows the page under the pointer enlarged. It is wider than tall, so it holds a few
 * words of a line rather than a few letters of several. It only repeats what the page already
 * shows, so it stays out of the accessibility tree and lets the pointer pass through.
 *
 * @param props - The lens's props.
 * @param props.lens - Where it goes and what it shows.
 * @returns The lens.
 */
function MagnifierLens({ lens }: Readonly<MagnifierLensProps>) {
	return (
		<div
			aria-hidden
			className={cn(
				'pointer-events-none absolute z-20 h-28 w-56 -translate-x-1/2 overflow-hidden rounded-xl border-4 border-white bg-white shadow-xl sm:h-40 sm:w-80',
				lens.isAbovePoint ? '-translate-y-[calc(100%+1rem)]' : '-translate-y-1/2',
			)}
			style={{ left: lens.x, top: lens.y }}
		>
			{/* The same CDN image the book shows; see `flipbook.tsx` for why it is no `next/image`. */}
			{/* oxlint-disable-next-line nextjs/no-img-element -- see above */}
			<img
				alt=""
				className="absolute max-w-none"
				decoding="async"
				src={lens.src}
				style={{
					height: lens.page.height,
					left: `calc(50% - ${lens.page.x}px)`,
					top: `calc(50% - ${lens.page.y}px)`,
					width: lens.page.width,
				}}
			/>
		</div>
	);
}

interface MagnifierLensProps {
	lens: Lens;
}

export { MagnifierLens };
