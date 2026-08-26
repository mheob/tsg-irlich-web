import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NumberTicker } from './number-ticker';

// `useSpring` (mocked in `test-utils/setup-dom.ts`) forwards its source motion value to its own
// listeners the instant the source changes — there is no eased sequence of intermediate frames the
// way a real spring produces. So a test here can genuinely prove that `number-ticker.tsx`'s
// subscription wiring runs end to end (the displayed text starts at the start value, the delayed
// `motionValue.set` fires, the `springValue.on('change', ...)` listener receives it and writes the
// formatted string to the DOM), and that the formatting itself — locale, thousands separator,
// decimal places — is correct. It CANNOT prove anything about the count-up motion a user would
// actually see: no easing, no intermediate digits, no damping/stiffness behaviour. That is left
// entirely unproven by this suite.
//
// Every expected string below is `Intl.NumberFormat('de-DE', { maximumFractionDigits,
// minimumFractionDigits }).format(value)`, computed independently of `formatNumber` (not exported
// by `number-ticker.tsx`) rather than imported from `DEFAULT_LOCALE` — 'de-DE' is `DEFAULT_LOCALE`'s
// current value (`src/constants/time.ts`), hard-coded here per the "never build an expected value
// from a constant the implementation also imports" rule.

/**
 * The single `<span>` `NumberTicker` renders, or a thrown error if it is missing — kept as a
 * top-level helper (rather than an inline null-check in each test) so no test body contains a
 * conditional, matching the `vitest/no-conditional-in-test` rule.
 *
 * @param container - The render result's container to search within.
 * @returns The ticker's `<span>` element.
 */
function getTicker(container: HTMLElement): HTMLSpanElement {
	const ticker = container.querySelector('span');
	if (!ticker) {
		throw new Error('Expected NumberTicker to render a <span>');
	}
	return ticker;
}

describe('the number ticker', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts at zero, formatted with the de-DE thousands separator, and reaches the target after the (zero) delay', () => {
		vi.useFakeTimers();
		const { container } = render(<NumberTicker decimalPlaces={0} delay={0} value={1234} />);

		const ticker = getTicker(container);

		expect(ticker.textContent).toBe('0');
		expect(ticker.getAttribute('aria-live')).toBe('polite');
		expect(ticker.getAttribute('aria-atomic')).toBe('true');

		act(() => {
			vi.advanceTimersByTime(0);
		});

		expect(ticker.textContent).toBe('1.234');
	});

	it('formats both the start and the target value to the configured number of decimal places', () => {
		vi.useFakeTimers();
		const { container } = render(<NumberTicker decimalPlaces={2} delay={0} value={12.5} />);

		const ticker = getTicker(container);

		expect(ticker.textContent).toBe('0,00');

		act(() => {
			vi.advanceTimersByTime(0);
		});

		expect(ticker.textContent).toBe('12,50');
	});

	it('does not update before the full delay (in seconds) has elapsed, and updates exactly once it has', () => {
		vi.useFakeTimers();
		const { container } = render(<NumberTicker decimalPlaces={0} delay={2} value={100} />);

		const ticker = getTicker(container);

		act(() => {
			vi.advanceTimersByTime(1999);
		});
		expect(ticker.textContent).toBe('0');

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(ticker.textContent).toBe('100');
	});

	it('counts down from value to startValue when direction is "down"', () => {
		vi.useFakeTimers();
		const { container } = render(
			<NumberTicker decimalPlaces={0} delay={0} direction="down" startValue={0} value={50} />,
		);

		const ticker = getTicker(container);

		expect(ticker.textContent).toBe('50');

		act(() => {
			vi.advanceTimersByTime(0);
		});

		expect(ticker.textContent).toBe('0');
	});
});
