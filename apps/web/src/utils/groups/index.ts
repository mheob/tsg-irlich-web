/* cspell:words angebot, kurse */
import type { DosbIconName } from '@tsgi-web/shared/icons/dosb.types';
import type { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';
import type { ImageProps } from 'next/image';

import fallbackImageFile from './_assets/_fallback.webp';
import soccerImage from './_assets/fussball.webp';
import gymnasticImage from './_assets/kinderturnen.webp';
import danceImage from './_assets/tanzen.webp';

interface OfferGroupImage {
	alt: ImageProps['alt'];
	src: ImageProps['src'];
}

export interface GroupSection {
	_type: string;
	icon: DosbIconName;
	image: OfferGroupImage;
	slug: string;
	title: string;
}

export const fallbackImage: OfferGroupImage = {
	alt: 'Vier Kinder in blauen Sportuniformen, die Handstände gegen eine Wand machen.',
	src: fallbackImageFile,
};

export const groupSections: GroupSection[] = [
	{
		_type: 'group.soccer',
		icon: 'Fussball',
		image: {
			alt: 'Fußball',
			src: soccerImage,
		},
		slug: '/angebot/fussball',
		title: 'Fußball',
	},
	{
		_type: 'group.children-gymnastics',
		icon: 'Turnen',
		image: {
			alt: 'Kinderturnen',
			src: gymnasticImage,
		},
		slug: '/angebot/kinderturnen',
		title: 'Kinderturnen',
	},
	{
		_type: 'group.courses',
		icon: 'StepAerobic',
		image: {
			alt: 'Kurse',
			src: soccerImage,
		},
		slug: '/angebot/kurse',
		title: 'Kurse',
	},
	{
		_type: 'group.taekwondo',
		icon: 'Taekwondo',
		image: {
			alt: 'Taekwondo',
			src: soccerImage,
		},
		slug: '/angebot/taekwondo',
		title: 'Taekwondo',
	},
	{
		_type: 'group.dance',
		icon: 'Tanzen',
		image: {
			alt: 'Vier Kinder in blauen Sportuniformen, die Handstände gegen eine Wand machen.',
			src: danceImage,
		},
		slug: '/angebot/tanzen',
		title: 'Tanzen',
	},
	{
		_type: 'group.other-sports',
		icon: 'Fitness',
		image: {
			alt: 'Weitere Sportarten',
			src: soccerImage,
		},
		slug: '/angebot/weitere-sportarten',
		title: 'Weitere Sportarten',
	},
];

export function getOGImage(group: string): OpenGraph['images'] {
	const groupSection = groupSections.find(section => section.slug === `/angebot/${group}`);
	const imageURL = groupSection ? `/og/angebot/groups/${group}.webp` : `/og/angebot.webp`;

	return {
		alt: groupSection?.image?.alt ?? fallbackImage.alt,
		height: 630,
		url: imageURL,
		width: 1200,
	};
}

export function getGroupImage(group: string, path = ''): GroupSection['image'] {
	const groupSection = groupSections.find(section => section.slug === `${path}/${group}`);
	return groupSection?.image ?? fallbackImage;
}
