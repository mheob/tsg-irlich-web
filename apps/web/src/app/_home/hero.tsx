import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/ui/section-header';
import SocialMediaIcon from '@/components/ui/social-media-icon';
import ArrowCta from '@/icons/design/arrow-cta';
import YogaImage from '@/images/yoga-tsg-irlich.de.webp';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries';
import type { Home } from '@/types/sanity.types';
import { cn } from '@/utils/cn';
import { getSocialMediaIcon } from '@/utils/icon';

import styles from './hero.module.css';

type HeroProps = Pick<Home, 'intro' | 'subtitle' | 'title'>;

export default async function Hero({ intro, subtitle, title }: Readonly<HeroProps>) {
	const socialMedia = await client.fetch(socialMediaQuery);

	return (
		<section className="md:relative">
			<div className="container mx-auto -mt-40 min-h-dvh items-center py-5 pt-40 md:flex">
				<div className="md:w-1/2">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="text-primary mt-12 flex gap-8">
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
							'bottom-5 left-[10%] right-[10%] w-[80%]',
							'md:bottom-0 md:left-1/2 md:right-auto md:w-1/3',
						)}
						alt="Ein Frau, die am meditieren ist."
						src={YogaImage}
					/>

					<div
						className={cn(
							'flex text-white',
							'w-full items-end justify-around justify-self-end pb-6',
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
					</div>
				</div>
			</div>
		</section>
	);
}
