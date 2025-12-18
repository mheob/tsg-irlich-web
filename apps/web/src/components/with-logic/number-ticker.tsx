'use client';

import { cn } from '@tsgi-web/shared';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useRef } from 'react';

import { DEFAULT_LOCALE } from '@/constants/time';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
	decimalPlaces?: number;
	delay?: number;
	direction?: 'down' | 'up';
	startValue?: number;
	value: number;
}

export function NumberTicker({
	className,
	decimalPlaces = 0,
	delay = 0,
	direction = 'up',
	startValue = 0,
	value,
	...props
}: Readonly<NumberTickerProps>) {
	const reference = useRef<HTMLSpanElement>(null);
	const motionValue = useMotionValue(direction === 'down' ? value : startValue);
	const springValue = useSpring(motionValue, {
		damping: 60,
		stiffness: 100,
	});
	const isInView = useInView(reference, { margin: '0px', once: true });

	useEffect(() => {
		if (isInView) {
			const timer = setTimeout(() => {
				motionValue.set(direction === 'down' ? startValue : value);
			}, delay * 1000);
			return () => clearTimeout(timer);
		}
	}, [motionValue, isInView, delay, value, direction, startValue]);

	useEffect(
		() =>
			springValue.on('change', latest => {
				if (reference.current) {
					reference.current.textContent = Intl.NumberFormat(DEFAULT_LOCALE, {
						maximumFractionDigits: decimalPlaces,
						minimumFractionDigits: decimalPlaces,
					}).format(Number(latest.toFixed(decimalPlaces)));
				}
			}),
		[springValue, decimalPlaces],
	);

	return (
		<span
			className={cn('inline-block text-black tabular-nums', className)}
			ref={reference}
			{...props}
		>
			{startValue}
		</span>
	);
}
