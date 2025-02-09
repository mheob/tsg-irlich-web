import {
	type IconType,
	SiFacebook,
	SiInstagram,
	SiWhatsapp,
	SiYoutube,
} from '@icons-pack/react-simple-icons';

interface SocialMediaIcons {
	facebook: IconType;
	instagram: IconType;
	whatsapp: IconType;
	youtube: IconType;
}

export const socialMediaMap: SocialMediaIcons = {
	facebook: SiFacebook,
	instagram: SiInstagram,
	whatsapp: SiWhatsapp,
	youtube: SiYoutube,
};
