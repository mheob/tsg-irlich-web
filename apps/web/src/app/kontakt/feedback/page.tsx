import type { Metadata } from 'next';

import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';
import contactImage from '@/images/kontakt/hero.webp';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function Page() {
	return (
		<>
			<Hero
				image={{
					alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
					src: contactImage,
				}}
				subTitle="Feedback"
				title="Feedback abgeben"
			/>
			<FeedbackForm />
		</>
	);
}
