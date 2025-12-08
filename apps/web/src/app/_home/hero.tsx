import { cn } from '@tsgi-web/shared';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { SocialMediaIcon } from '@/components/ui/social-media-icon';
import ArrowCta from '@/icons/design/arrow-cta';
import HeroImage from '@/images/home/hero.webp';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import type { Home } from '@/types/sanity.types';
import { getSocialMediaIcon } from '@/utils/icon';

import styles from './hero.module.css';

type HeroProps = Pick<Home, 'intro' | 'subtitle' | 'title'>;

export async function Hero({ intro, subtitle, title }: Readonly<HeroProps>) {
	const socialMedia = await client.fetch(socialMediaQuery);

	return (
		<section className="relative pt-20 md:grid md:h-dvh md:pt-48">
			<div className="container mx-auto items-center pt-5 md:flex">
				<div className="md:w-1/2">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="text-primary my-12 flex gap-8">
						<Button asChild>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>

						<ArrowCta aria-hidden="true" />
					</div>
				</div>

				<div className="relative grid h-96 md:static md:ml-auto">
					<div className={styles.bgRoundedEdge}></div>
					<div className={styles.bgBalls}></div>

					<Image
						className={cn(
							'absolute',
							'start-[10%] end-[10%] bottom-20 w-[80%]',
							'md:start-1/2 md:end-auto md:bottom-15 md:w-[40%]',
							'3xl:bottom-15 3xl:w-[30%]',
						)}
						alt="Ein Frau, die am meditieren ist."
						src={HeroImage}
					/>

					<nav
						className={cn(
							'flex text-white',
							'w-full items-end justify-around justify-self-end py-10',
							'md:flex-col md:justify-center md:gap-10',
						)}
					>
						{socialMedia &&
							Object.entries(socialMedia).map(([name, url]) => (
								<SocialMediaIcon
									href={url}
									icon={getSocialMediaIcon(name)}
									key={url}
									label={name}
								/>
							))}
					</nav>
				</div>
			</div>
		</section>
	);
}
