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
import { getSocialMediaIcon } from '@/utils/icon';

import styles from './hero.module.css';

type HeroProps = Pick<Home, 'intro' | 'subtitle' | 'title'>;

export default async function Hero({ intro, subtitle, title }: Readonly<HeroProps>) {
	const socialMedia = await client.fetch(socialMediaQuery);

	return (
		<section>
			<div className="container mx-auto -mt-40 flex min-h-dvh items-center py-5 pt-40">
				<div className="w-1/2">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="text-primary relative mt-12 flex gap-8">
						<Button asChild>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>

						<ArrowCta aria-hidden="true" />
					</div>
				</div>

				<div className="ml-auto">
					<div className={styles.bgRoundedEdge}></div>
					<div className={styles.bgBalls}></div>

					<Image
						alt="Ein Frau, die am meditieren ist."
						className="absolute bottom-0 left-1/2 w-1/3"
						src={YogaImage}
					/>

					<div className="flex flex-col gap-10 text-white">
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
