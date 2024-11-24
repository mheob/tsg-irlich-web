import type { HTMLAttributes } from 'react';

import type { Stats } from '@/types/sanity.types';
import { cn } from '@/utils';

function CounterItem({ suffix = '', title, value }: Readonly<Stats>) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 py-8">
			<div className="font-sans-serif text-7xl font-bold">{`${value}${suffix}`}</div>
			<h2 className="text-xl">{title}</h2>
		</div>
	);
}

interface CounterProps {
	className?: HTMLAttributes<HTMLDivElement>['className'];
	values: Stats[];
}

export default function Counter({ className, values }: Readonly<CounterProps>) {
	return (
		<div
			className={cn(
				{ 'grid-cols-3': values?.length === 3 },
				{ 'grid-cols-4': values?.length === 4 },
				'container mx-auto grid grid-rows-1 divide-x-2 px-5 py-32',
				className,
			)}
		>
			{values?.length
				? values.map(value => <CounterItem key={value.title} {...value} />)
				: 'No values'}
		</div>
	);
}
