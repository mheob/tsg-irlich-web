// PROTOTYPE (WEB-326) — two variants of the sponsor and partner page, switchable via `?variant=A|B`
// and the floating bar at the bottom (← → keys work too). Throwaway: lives on a prototype branch,
// never in `next`. The winning variant is rebuilt properly with a Sanity singleton.

import type { Metadata } from 'next';

import { PrototypeSwitcher } from '@/components/with-logic/prototype-switcher';
import { env } from '@/lib/env';

import { getSponsorPageData } from './_shared/data';
import { VariantA } from './_variants/variant-a';
import { VariantB } from './_variants/variant-b';

const VARIANTS = [
	{ key: 'A', name: 'Vertraut' },
	{ key: 'B', name: 'Erzählend' },
] as const;

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Sponsoren & Partner (Prototyp)',
};

export default async function SponsorPrototypePage({
	searchParams,
}: PageProps<'/verein/sponsoren-prototyp'>) {
	const [{ variant }, data] = await Promise.all([searchParams, getSponsorPageData()]);
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
