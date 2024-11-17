import {
	type IconType,
	SiFacebook,
	SiInstagram,
	SiWhatsapp,
	SiYoutube,
} from '@icons-pack/react-simple-icons';

// TODO: get values from sanity

export const socialMedia: { href: string; icon: IconType; label: string }[] = [
	{
		href: '/instagram',
		icon: SiInstagram,
		label: 'Instagram',
	},
	{
		href: '/facebook',
		icon: SiFacebook,
		label: 'Facebook',
	},
	{
		href: '/youtube',
		icon: SiYoutube,
		label: 'Youtube',
	},
	{
		href: '/whatsapp',
		icon: SiWhatsapp,
		label: 'WhatsApp',
	},
];
