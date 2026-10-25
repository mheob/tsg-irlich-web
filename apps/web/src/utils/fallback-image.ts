import type { StaticImageData } from 'next/image';

import fallbackImageFile from '@/images/angebot/hero.webp';

/**
 * The picture of the offer that stands in wherever a department or a group has no image of its own
 * (or one without an asset), so a card or hero never renders a broken `<img>`.
 */
const OFFER_FALLBACK_IMAGE: OfferFallbackImage = {
	alt: 'Sporthalle mit drei verschiedenen Trainingsgruppen: Links üben Kinder und ein Trainer in weißen Taekwondo-Anzügen mit schwarzem Gürtel synchrone Kicks, in der Mitte zeigen Mädchen in türkis-blauen Gymnastik-Trikots mit bunten Federn eine Beinübung, und rechts spielen Kinder unter Anleitung von Trainern in dunkelblauen Shirts Fußball auf einer grünen Kunstrasenfläche. Im Hintergrund sind bunte Gymnastikbälle und Sportgeräte zu sehen.',
	src: fallbackImageFile,
};

interface OfferFallbackImage {
	alt: string;
	src: StaticImageData;
}

export { OFFER_FALLBACK_IMAGE };
