import type { ComponentProps, HTMLAttributes } from 'react';

import { cn } from '@/utils';

interface CounterItemProps {
	suffix?: string;
	title: string;
	value: number;
}

function CounterItem({ suffix = '', title, value }: CounterItemProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 py-8">
			<div className="font-sans-serif text-7xl font-bold">{`${value}${suffix}`}</div>
			<h2 className="text-xl">{title}</h2>
		</div>
	);
}

interface CounterProps {
	className?: HTMLAttributes<HTMLDivElement>['className'];
	values: ComponentProps<typeof CounterItem>[];
}

export default function Counter({ className, values }: CounterProps) {
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
