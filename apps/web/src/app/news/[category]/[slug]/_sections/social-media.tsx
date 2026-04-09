import { SocialMediaIcon } from '@/components/ui/social-media-icon';
import type { SocialMediaQueryResult } from '@/types/sanity.types';
import { getSocialMediaIcon } from '@/utils/icon';

interface SocialMediaProps {
	socialMedia?: null | SocialMediaQueryResult;
}

export function SocialMedia({ socialMedia }: Readonly<SocialMediaProps>) {
	if (!socialMedia) {
		return null;
	}

	return (
		<section className="mt-10">
			<h3>Folge uns!</h3>

			<div className="mt-4 flex gap-4 text-primary">
				{Object.entries(socialMedia).map(([name, url]) => (
					<SocialMediaIcon href={url} icon={getSocialMediaIcon(name)} key={url} label={name} />
				))}
			</div>
		</section>
	);
}
