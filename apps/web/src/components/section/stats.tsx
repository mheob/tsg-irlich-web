import { Counter } from '@/components/ui/counter';
import type { StatsSection } from '@/types/sanity.types';

type StatsProps = Readonly<StatsSection>;

export function Stats({ stats }: StatsProps) {
	return <Counter values={stats} />;
}
