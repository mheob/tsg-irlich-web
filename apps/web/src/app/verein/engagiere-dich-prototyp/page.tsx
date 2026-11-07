// PROTOTYPE (WEB-190) — two variants of the volunteering page, switchable via `?variant=A|B` and
// the floating bar at the bottom (← → keys work too). Throwaway: lives on a prototype branch, never
// in `next`. The winning variant is rebuilt properly with a Sanity singleton and real positions.

import type { Metadata } from 'next';

import { PrototypeSwitcher } from '@/components/with-logic/prototype-switcher';
import { env } from '@/lib/env';

import { getVolunteerPageData } from './_shared/data';
import { VariantA } from './_variants/variant-a';
import { VariantB } from './_variants/variant-b';

const VARIANTS = [
	{ key: 'A', name: 'Nah am Entwurf' },
	{ key: 'B', name: 'Persönlich' },
] as const;

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Engagiere dich (Prototyp)',
};

export default async function VolunteerPrototypePage({
	searchParams,
}: PageProps<'/verein/engagiere-dich-prototyp'>) {
	const [{ variant }, data] = await Promise.all([searchParams, getVolunteerPageData()]);
	const current = variant === 'B' ? 'B' : 'A';

	return (
		<>
			{current === 'A' && <VariantA {...data} />}
			{current === 'B' && <VariantB {...data} />}
			{env('NODE_ENV') !== 'production' && (
				<PrototypeSwitcher current={current} variants={VARIANTS} />
			)}
		</>
	);
}
