import { Counter } from '@/components/ui/counter';
import type { Stats as StatsProps } from '@/types/sanity.types';

export function Stats({ stats }: Readonly<{ stats: StatsProps[] }>) {
	return <Counter values={stats} />;
}
