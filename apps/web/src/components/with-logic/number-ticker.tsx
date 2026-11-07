'use client';

import { useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useRef } from 'react';

import { cn, timeSpanInMilliSeconds } from '@tsgi-web/shared';

import { DEFAULT_LOCALE } from '@/constants/time';

function formatNumber(value: number, decimalPlaces: number) {
	return Intl.NumberFormat(DEFAULT_LOCALE, {
		maximumFractionDigits: decimalPlaces,
		minimumFractionDigits: decimalPlaces,
	}).format(value);
}

function Count({
	className,
	decimalPlaces = 0,
	delay = 0,
	from,
	to,
	...props
}: Readonly<CountProps>) {
	const reference = useRef<HTMLSpanElement>(null);
	const digitsReference = useRef<HTMLSpanElement>(null);
	const shouldReduceMotion = useReducedMotion();
	const motionValue = useMotionValue(from);
	const springValue = useSpring(motionValue, {
		damping: 60,
		stiffness: 100,
	});

	// oxlint-disable-next-line typescript/no-invalid-void-type
	useEffect((): (() => void) | void => {
		const element = reference.current;
		const digits = digitsReference.current;
		if (shouldReduceMotion || from === to || !element || !digits) {
			return;
		}

		// What the observer has done so far. It lives in the effect, nothing renders from it.
		const count: { isReset: boolean; timer?: ReturnType<typeof setTimeout> } = { isReset: false };

		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				observer.disconnect();
				if (count.isReset) {
					count.timer = setTimeout(
						() => {
							motionValue.set(to);
						},
						delay * timeSpanInMilliSeconds('second'),
					);
				}
			} else if (!count.isReset) {
				count.isReset = true;
				digits.textContent = formatNumber(from, decimalPlaces);
			}
		});
		observer.observe(element);

		return () => {
			observer.disconnect();
			clearTimeout(count.timer);
		};
	}, [decimalPlaces, delay, from, motionValue, shouldReduceMotion, to]);

	useEffect(() => {
		const unsubscribe = springValue.on('change', (latest) => {
			if (digitsReference.current) {
				// The spring ends exactly on its target; emptying the overlay there shows the final
				// value underneath again.
				digitsReference.current.textContent =
					latest === to ? '' : formatNumber(latest, decimalPlaces);
			}
		});
		return unsubscribe;
	}, [decimalPlaces, springValue, to]);

	return (
		<span
			className={cn('relative inline-block tabular-nums', className)}
			ref={reference}
			{...props}
		>
			<span
				aria-hidden="true"
				className="peer pointer-events-none absolute inset-e-0 top-0 whitespace-nowrap select-none"
				ref={digitsReference}
			/>
			<span className="peer-not-empty:text-transparent">{formatNumber(to, decimalPlaces)}</span>
		</span>
	);
}

interface NumberTickerProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
	decimalPlaces?: number;
	/** Seconds between scrolling into view and the start of the count. */
	delay?: number;
	direction?: 'down' | 'up';
	startValue?: number;
	value: number;
}

interface CountProps extends Omit<NumberTickerProps, 'direction' | 'startValue' | 'value'> {
	from: number;
	to: number;
}

/**
 * A number that counts up to its value once it scrolls into view.
 *
 * The server renders the final value, so crawlers, visitors without JavaScript and visitors who ask
 * for reduced motion read the real number. To count, the start value has to replace it first, and
 * that swap is only invisible while the number is off screen. The intersection observer's first
 * report decides: a number on screen from the start keeps its value, a number below the fold is
 * reset to the start value right there and counts once it scrolls in.
 *
 * The counting digits are an overlay hidden from assistive technology and empty unless a count is
 * running. While they show, CSS turns the final value underneath transparent, which keeps it in
 * the layout and in the accessibility tree, so a screen reader reads the final value once and the
 * width of the number never changes.
 *
 * Every value is a count of its own: a changed value (an edit in the live preview) remounts the
 * counter, which drops a spring still heading for the old one.
 *
 * @param props - The span's props plus the count's.
 * @param props.direction - `up` counts from `startValue` to `value`, `down` the other way round.
 * @param props.startValue - Where an upward count starts and a downward one ends.
 * @param props.value - Where an upward count ends and a downward one starts.
 * @returns The number, at its final value until a count runs.
 */
export function NumberTicker({
	direction = 'up',
	startValue = 0,
	value,
	...props
}: Readonly<NumberTickerProps>) {
	const from = direction === 'down' ? value : startValue;
	const to = direction === 'down' ? startValue : value;

	return <Count from={from} key={`${from}:${to}`} to={to} {...props} />;
}
