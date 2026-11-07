import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { setReducedMotion } from '../../../test-utils/setup-dom';
import { NumberTicker } from './number-ticker';

// `useSpring` (mocked in `test-utils/setup-dom.ts`) forwards its source motion value the instant the
// source changes, so the spring jumps from the start value straight to the target. These cases can
// prove when the count starts, where it starts and that it ends on the final value; they cannot see
// the eased digits a real spring produces in between.
//
// Every expected string is what `Intl.NumberFormat('de-DE', …)` prints, written out by hand rather
// than built from `DEFAULT_LOCALE`, which the implementation imports as well.

/** The observers the component under test created, in the order it created them. */
const observers: ControllableIntersectionObserver[] = [];

/**
 * An `IntersectionObserver` that reports only when a test tells it to, through
 * {@link reportVisibility}. The no-op stub of `setup-dom.ts` never calls its callback at all.
 */
class ControllableIntersectionObserver {
	public targets: Element[] = [];

	public constructor(public readonly onReport: IntersectionObserverCallback) {
		observers.push(this);
	}

	public disconnect(): void {
		this.targets = [];
	}

	public observe(target: Element): void {
		this.targets.push(target);
	}

	public takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	public unobserve(target: Element): void {
		this.targets = this.targets.filter((observed) => observed !== target);
	}
}

/**
 * Makes every observer that still observes something report its targets as on or off screen.
 *
 * @param isIntersecting - Whether the targets are reported as on screen.
 */
function reportVisibility(isIntersecting: boolean): void {
	act(() => {
		for (const observer of observers.filter(({ targets }) => targets.length > 0)) {
			const entries = observer.targets.map((target) => ({ isIntersecting, target }));
			observer.onReport(
				entries as unknown as IntersectionObserverEntry[],
				observer as unknown as IntersectionObserver,
			);
		}
	});
}

/**
 * The text a screen reader gets: everything except the subtrees hidden from assistive technology.
 *
 * @param element - The rendered markup.
 * @returns Its text without the `aria-hidden` parts.
 */
function textForScreenReaders(element: Element): string {
	const copy = element.cloneNode(true) as Element;
	for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
		hidden.remove();
	}
	return copy.textContent;
}

/**
 * The digits that count, which only sighted visitors get.
 *
 * @param element - The rendered markup.
 * @returns The text of the part hidden from assistive technology.
 */
function countingDigits(element: Element): string | undefined {
	return element.querySelector('[aria-hidden="true"]')?.textContent;
}

/**
 * The markup the server sends, parsed the way a crawler or a browser without JavaScript sees it.
 *
 * @param markup - The HTML string to parse.
 * @returns A detached element holding it.
 */
function parse(markup: string): HTMLElement {
	const element = document.createElement('div');
	element.innerHTML = markup;
	return element;
}

describe('the number ticker', () => {
	const setupObserver = globalThis.IntersectionObserver;

	beforeEach(() => {
		observers.length = 0;
		vi.stubGlobal('IntersectionObserver', ControllableIntersectionObserver);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.stubGlobal('IntersectionObserver', setupObserver);
	});

	describe('on the server', () => {
		it('sends the final value, once and without the start value', () => {
			const markup = parse(renderToString(<NumberTicker value={1234} />));

			expect(markup.textContent).toBe('1.234');
		});

		it('sends a value with the configured number of decimal places', () => {
			const markup = parse(renderToString(<NumberTicker decimalPlaces={2} value={12.5} />));

			expect(markup.textContent).toBe('12,50');
		});

		it('sends the start value as the final value of a count down', () => {
			const markup = parse(
				renderToString(<NumberTicker direction="down" startValue={5} value={50} />),
			);

			expect(markup.textContent).toBe('5');
		});

		it('hydrates without a mismatch and without changing the value it sent', () => {
			setReducedMotion(false);
			const ticker = <NumberTicker value={1234} />;
			const container = parse(renderToString(ticker));
			document.body.append(container);
			const onRecoverableError = vi.fn();

			const root = hydrateRoot(container, ticker, { onRecoverableError });
			act(() => {
				vi.runAllTimers();
			});

			expect(onRecoverableError).not.toHaveBeenCalled();
			expect(textForScreenReaders(container)).toBe('1.234');
			expect(countingDigits(container)).toBe('');

			act(() => {
				root.unmount();
			});
			container.remove();
		});
	});

	describe('for assistive technology', () => {
		it('announces nothing on its own', () => {
			const { container } = render(<NumberTicker value={1234} />);

			expect(container.querySelector('[aria-live]')).toBeNull();
		});

		it('reads the final value while the digits are still counting', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker value={1234} />);

			reportVisibility(false);

			expect(countingDigits(container)).toBe('0');
			expect(textForScreenReaders(container)).toBe('1.234');
		});
	});

	describe('in the browser', () => {
		it('leaves a number that is on screen from the start as it is', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker value={1234} />);

			reportVisibility(true);
			reportVisibility(false);
			act(() => {
				vi.runAllTimers();
			});

			expect(countingDigits(container)).toBe('');
			expect(textForScreenReaders(container)).toBe('1.234');
		});

		it('resets a number below the fold to the start value and counts up once it scrolls in', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker decimalPlaces={2} value={12.5} />);

			reportVisibility(false);

			expect(countingDigits(container)).toBe('0,00');

			reportVisibility(true);
			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(countingDigits(container)).toBe('');
			expect(textForScreenReaders(container)).toBe('12,50');
		});

		it('starts counting only once the delay (in seconds) has passed', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker delay={2} value={100} />);

			reportVisibility(false);
			reportVisibility(true);
			act(() => {
				vi.advanceTimersByTime(1999);
			});

			expect(countingDigits(container)).toBe('0');

			act(() => {
				vi.advanceTimersByTime(1);
			});

			expect(countingDigits(container)).toBe('');
		});

		it('counts down from the value to the start value when direction is "down"', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker direction="down" startValue={5} value={50} />);

			reportVisibility(false);

			expect(countingDigits(container)).toBe('50');

			reportVisibility(true);
			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(countingDigits(container)).toBe('');
			expect(textForScreenReaders(container)).toBe('5');
		});

		it('keeps the final value when reduced motion is requested', () => {
			setReducedMotion(true);
			const { container } = render(<NumberTicker value={1234} />);

			reportVisibility(false);

			expect(observers).toStrictEqual([]);
			expect(countingDigits(container)).toBe('');
			expect(textForScreenReaders(container)).toBe('1.234');
		});

		it('leaves a value alone that equals its start value', () => {
			setReducedMotion(false);
			const { container } = render(<NumberTicker value={0} />);

			reportVisibility(false);

			expect(observers).toStrictEqual([]);
			expect(countingDigits(container)).toBe('');
		});

		it('starts over with the new value when the value changes', () => {
			setReducedMotion(false);
			const { container, rerender } = render(<NumberTicker value={100} />);

			reportVisibility(false);
			rerender(<NumberTicker value={200} />);

			expect(countingDigits(container)).toBe('');
			expect(textForScreenReaders(container)).toBe('200');
		});

		it('stops counting when it is removed before the delay has passed', () => {
			setReducedMotion(false);
			const { unmount } = render(<NumberTicker delay={1} value={100} />);

			reportVisibility(false);
			reportVisibility(true);
			unmount();

			expect(vi.getTimerCount()).toBe(0);
		});
	});
});
