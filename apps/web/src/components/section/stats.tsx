import { cn } from '@tsgi-web/shared';
import type { ComponentProps } from 'react';

import { Counter } from '@/components/ui/counter';
import type { Stats as StatsProperties } from '@/types/sanity.types';

interface StatsProps extends ComponentProps<'section'> {
	stats: StatsProperties[];
	withBackground?: boolean;
}
export function Stats({
	className,
	stats,
	withBackground = false,
	...props
}: Readonly<StatsProps>) {
	return (
		<section {...props} className={cn(className, withBackground && 'bg-background-low-contrast')}>
			<Counter values={stats} />
		</section>
	);
}
