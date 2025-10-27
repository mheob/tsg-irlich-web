import type { ComponentProps } from 'react';

import { Counter } from '@/components/ui/counter';
import type { Stats as StatsProperties } from '@/types/sanity.types';

interface StatsProps extends ComponentProps<'section'> {
	stats: StatsProperties[];
}
export function Stats({ stats, ...props }: Readonly<StatsProps>) {
	return (
		<section {...props}>
			<Counter values={stats} />
		</section>
	);
}
