import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithRef } from 'react';

import { DEFAULT_LOCALE } from '@/constants/time';
import type { Stats } from '@/types/sanity.types';

function CounterItem({ suffix = '', title, value }: Readonly<Stats>) {
	return (
		<div className="flex flex-col items-center gap-2 py-8 md:justify-center">
			<div className="font-sans-serif text-3xl font-bold md:text-7xl">{`${value.toLocaleString(DEFAULT_LOCALE)}${suffix}`}</div>
			<h2 className="text-center text-lg md:text-xl">{title}</h2>
		</div>
	);
}

interface CounterProps extends ComponentPropsWithRef<'div'> {
	values: Readonly<Stats[]>;
}

export function Counter({ className, values, ...props }: Readonly<CounterProps>) {
	return (
		<div
			className={cn(
				{ 'grid-cols-1': values?.length === 3 },
				{ 'grid-cols-2': values?.length === 4 },
				{ 'md:grid-cols-3': values?.length === 3 },
				{ 'md:grid-cols-4': values?.length === 4 },
				'container mx-auto grid grid-rows-1 gap-4 px-5 py-10 md:divide-x-2 md:py-32',
				className,
			)}
			{...props}
		>
			{values?.length
				? values.map(value => <CounterItem key={value.title} {...value} />)
				: 'No values'}
		</div>
	);
}
