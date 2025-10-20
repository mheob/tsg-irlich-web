// cSpell:words taekwondo

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import visionImage1 from '@/images/home/vision/vision-1.webp';
import visionImage2 from '@/images/home/vision/vision-2.webp';
import visionImage3 from '@/images/home/vision/vision-3.webp';
import type { Home } from '@/types/sanity.types';

import styles from './vision.module.css';

type VisionProps = Home['content']['visionSection'];

export function Vision({ cta, intro, subtitle, title }: Readonly<VisionProps>) {
	return (
		<section className="relative items-center">
			<div className="md:container md:grid md:grid-cols-[55%_45%] md:px-5 md:not-last-of-type:mx-auto">
				<div className="relative container mx-auto h-80 px-5 md:static">
					<div className={styles.bgRoundedEdge}></div>

					<div className="absolute top-5 bottom-24 left-[calc(50%-6rem)] size-40 md:top-20 md:left-[calc(28%-12rem)] md:size-56 lg:size-96">
						<Image
							alt="Scheck-Übergabe: TSG Irlich überreicht 250 Euro Spende zum Wiederaufbau des Engerser Lockschuppens."
							className="rounded-full"
							src={visionImage1}
							fill
						/>
					</div>

					<div className="absolute end-8 bottom-8 size-32 md:top-[calc(50%-3rem)] md:left-[calc(13%-8rem)] md:size-48 lg:size-64">
						<Image
							alt="Tanzgruppe 'Funky Diamonds' der TSG Irlich präsentiert eine Choreografie in rot-weißen Kostümen auf der Bühne"
							className="rounded-full"
							src={visionImage2}
							fill
						/>
					</div>

					<div className="absolute -bottom-4 left-10 size-32 md:bottom-24 md:left-[calc(29%-8rem)] md:size-48 lg:size-64">
						<Image
							alt="Jugend-Fußballmannschaft der TSG Irlich in gelb-blauen Trikots steht Arm in Arm auf dem Sportplatz"
							className="rounded-full"
							src={visionImage3}
							fill
						/>
					</div>
				</div>

				<div className="container mx-auto px-5 pt-18 pb-10 text-center md:py-60 md:text-left">
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
						{intro}
					</SectionHeader>

					<Button className="relative mt-12" asChild>
						<Link href="#!">{cta}</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
