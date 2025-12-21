import type {
	internalGroqTypeReferenceTo,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
} from './sanity.types.generated';

export interface SanityImage {
	_type: 'image';
	alt?: string;
	asset?: SanityImageAssetReference;
	crop?: SanityImageCrop;
	hotspot?: SanityImageHotspot;
	media?: unknown;
}

export interface SanityImageReference {
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

export interface ExtendedImage extends SanityImageReference {
	_type: 'extendedImage';
}

export interface MainImage extends SanityImageReference {
	_type: 'mainImage';
}

export type AnyImage = ExtendedImage | MainImage | SanityImage;
