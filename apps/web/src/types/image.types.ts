import type {
	internalGroqTypeReferenceTo,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
} from './sanity.types.generated';

interface SanityImage {
	_type: 'image';
	alt?: string;
	asset?: SanityImageAssetReference;
	crop?: SanityImageCrop;
	hotspot?: SanityImageHotspot;
	media?: unknown;
}

interface SanityImageReference {
	asset?: {
		_ref: string;
		_type: 'reference';
		_weak?: boolean;
		[internalGroqTypeReferenceTo]?: 'sanity.imageAsset';
	};
	alt: string;
	crop?: SanityImageCrop;
	hotspot?: SanityImageHotspot;
}

interface ExtendedImage extends SanityImageReference {
	_type: 'extendedImage';
}

interface MainImage extends SanityImageReference {
	_type: 'mainImage';
}

type AnyImage = ExtendedImage | MainImage | SanityImage;

export type { SanityImage, SanityImageReference, ExtendedImage, MainImage, AnyImage };
