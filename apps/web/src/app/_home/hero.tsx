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
		<section className="relative pt-20 lg:grid lg:h-dvh lg:pt-48">
			<div className="items-center pt-5 lg:container lg:flex">
				<div className="lg:no-container container lg:w-1/2">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="text-primary mt-8 mb-16 flex gap-8">
						<Button asChild>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>

						<ArrowCta aria-hidden="true" />
					</div>
				</div>

				<div className="relative grid h-96 lg:static lg:ml-auto">
					<div className={styles.bgRoundedEdge}></div>
					<div className={styles.bgBalls}></div>

					<Image
						className={cn(
							'absolute -z-1',
							'start-[15%] end-[15%] bottom-10 w-[70%]',
							'sm:start-[20%] sm:end-[20%] sm:bottom-5 sm:w-[60%]',
							'md:start-[30%] md:end-[30%] md:bottom-5 md:w-[40%]',
							'lg:start-1/2 lg:end-auto lg:bottom-15 lg:w-[30%]',
							'3xl:bottom-15 3xl:w-[30%]',
						)}
						alt="Ein Frau, die am meditieren ist."
						src={HeroImage}
					/>

					<nav
						className={cn(
							'flex text-white',
							'w-full items-end justify-around justify-self-end py-10',
							'lg:flex-col lg:justify-center lg:gap-10',
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
