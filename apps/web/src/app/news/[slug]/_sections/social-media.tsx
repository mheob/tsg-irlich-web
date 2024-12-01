import SocialMediaIcon from '@/components/ui/social-media-icon';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries';
import { getSocialMediaIcon } from '@/utils/icon';

export default async function SocialMedia() {
	const socialMedia = await client.fetch(socialMediaQuery);

	if (!socialMedia) return null;

	return (
		<section className="mt-10">
			<h3>Folge uns!</h3>

			<div className="text-primary mt-4 flex gap-4">
				{Object.entries(socialMedia).map(([name, url]) => (
					<SocialMediaIcon href={url} icon={getSocialMediaIcon(name)} key={url} label={name} />
				))}
			</div>
		</section>
	);
}
