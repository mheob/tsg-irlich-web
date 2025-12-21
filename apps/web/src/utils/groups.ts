/* cspell:words angebot, kurse */
import type { DosbIconName } from '@tsgi-web/shared/icons/dosb.types';
import type { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';
import type { ImageProps } from 'next/image';

import soccerImage from '@/images/angebot/groups/fussball.webp';
import gymnasticImage from '@/images/angebot/groups/kinderturnen.webp';
import coursesImage from '@/images/angebot/groups/kurse.webp';
import taekwondoImage from '@/images/angebot/groups/taekwondo.webp';
import danceImage from '@/images/angebot/groups/tanzen.webp';
import otherSportsImage from '@/images/angebot/groups/weitere-sportarten.webp';
import fallbackImageFile from '@/images/angebot/hero.webp';

import { getBaseUrl } from './url';

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
	alt: 'Sporthalle mit drei verschiedenen Trainingsgruppen: Links üben Kinder und ein Trainer in weißen Taekwondo-Anzügen mit schwarzem Gürtel synchrone Kicks, in der Mitte zeigen Mädchen in türkis-blauen Gymnastik-Trikots mit bunten Federn eine Beinübung, und rechts spielen Kinder unter Anleitung von Trainern in dunkelblauen Shirts Fußball auf einer grünen Kunstrasenfläche. Im Hintergrund sind bunte Gymnastikbälle und Sportgeräte zu sehen.',
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
			src: coursesImage,
		},
		slug: '/angebot/kurse',
		title: 'Kurse',
	},
	{
		_type: 'group.taekwondo',
		icon: 'Taekwondo',
		image: {
			alt: 'Taekwondo',
			src: taekwondoImage,
		},
		slug: '/angebot/taekwondo',
		title: 'Taekwondo',
	},
	{
		_type: 'group.dance',
		icon: 'Tanzen',
		image: {
			alt: 'Tanzen',
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
			src: otherSportsImage,
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
		url: `${getBaseUrl()}${imageURL}`,
		width: 1200,
	};
}

export function getGroupImage(group: string, path = ''): GroupSection['image'] {
	const groupSection = groupSections.find(section => section.slug === `${path}${group}`);
	return groupSection?.image ?? fallbackImage;
}

export function getCurrentDepartment(group: string): GroupSection | undefined {
	return groupSections.find(g => g.slug === `/angebot/${group}`);
}
