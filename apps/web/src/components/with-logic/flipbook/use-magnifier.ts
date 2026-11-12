import { useState } from 'react';
import type { DOMAttributes, PointerEvent } from 'react';

/** How much larger the lens shows a page than the book does. */
const ZOOM = 2.5;

/**
 * The page image under the pointer. The topmost image at that point is the leaf on screen; the
 * leaves behind it, which the engine keeps mounted around the current spread, come later.
 *
 * @param event - The pointer event on the book's box.
 * @returns The image, or `undefined` when the pointer is beside the pages.
 */
function findPageImage(event: PointerEvent<HTMLElement>): HTMLImageElement | undefined {
	const box = event.currentTarget;
	return document
		.elementsFromPoint(event.clientX, event.clientY)
		.find(
			(element): element is HTMLImageElement =>
				element instanceof HTMLImageElement && box.contains(element),
		);
}

/**
 * Where the lens goes and which part of which page it shows.
 *
 * @param event - The pointer event on the book's box.
 * @returns The lens, or `undefined` when there is no page under the pointer.
 */
function getLens(event: PointerEvent<HTMLElement>): Lens | undefined {
	const image = findPageImage(event);
	if (!image) {
		return undefined;
	}
	const book = event.currentTarget.getBoundingClientRect();
	const page = image.getBoundingClientRect();
	return {
		isAbovePoint: event.pointerType === 'touch',
		page: {
			height: page.height * ZOOM,
			width: page.width * ZOOM,
			x: (event.clientX - page.left) * ZOOM,
			y: (event.clientY - page.top) * ZOOM,
		},
		// `src` is the widest file the CDN delivers; `currentSrc` may be one picked for the book's size.
		src: image.src,
		x: event.clientX - book.left,
		y: event.clientY - book.top,
	};
}

/**
 * A lens that follows the pointer over the pages while it is switched on: a mouse or a pen on hover,
 * a finger while it touches the page (WEB-436).
 *
 * @returns Whether the lens is on, the lens itself while a page is under the pointer, the switch
 *   and the pointer handlers for the book's box.
 */
function useMagnifier(): Magnifier {
	const [isOn, setIsOn] = useState(false);
	const [lens, setLens] = useState<Lens>();

	const follow = (event: PointerEvent<HTMLElement>): void => {
		setLens(getLens(event));
	};
	const hide = (): void => {
		setLens(undefined);
	};
	// A lens from before the switch was turned off would reappear where it was left.
	const handleToggle = (pressed: boolean): void => {
		setIsOn(pressed);
		hide();
	};

	return {
		handleToggle,
		handlers: isOn
			? {
					onPointerCancel: hide,
					onPointerDown: follow,
					onPointerLeave: hide,
					onPointerMove: follow,
				}
			: {},
		isOn,
		lens: isOn ? lens : undefined,
	};
}

/** The switch, the lens and what the book's box needs for it. */
interface Magnifier {
	handleToggle: (pressed: boolean) => void;
	handlers: Partial<
		Pick<
			DOMAttributes<HTMLElement>,
			'onPointerCancel' | 'onPointerDown' | 'onPointerLeave' | 'onPointerMove'
		>
	>;
	isOn: boolean;
	/** The lens while the switch is on and a page is under the pointer. */
	lens?: Lens;
}

/** The lens over the book. */
interface Lens {
	/** Whether the lens sits above the point instead of around it, where a finger would cover it. */
	isAbovePoint: boolean;
	/** The page in the lens: its enlarged size and the point under the pointer within it. */
	page: { height: number; width: number; x: number; y: number };
	/** The page image. */
	src: string;
	/** The point under the pointer, relative to the book's box. */
	x: number;
	y: number;
}

export { useMagnifier };
export type { Lens };
