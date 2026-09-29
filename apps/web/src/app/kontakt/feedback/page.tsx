import type { Metadata } from 'next';

import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';
import contactImage from '@/images/kontakt/hero.webp';
import { getPageMetadata } from '@/utils/metadata';

const HERO_IMAGE = {
	alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
	src: contactImage,
};

export const metadata: Metadata = getPageMetadata({
	description:
		'Fehler gefunden, eine Idee oder eine Frage zur Website? Sag es uns, dein Feedback landet direkt beim Website-Team der TSG Irlich.',
	path: '/kontakt/feedback',
	title: 'Feedback zur Website',
});

export default function Page() {
	return (
		<>
			<Hero image={HERO_IMAGE} subTitle="Feedback" title="Feedback abgeben" />
			<FeedbackForm />
		</>
	);
}
