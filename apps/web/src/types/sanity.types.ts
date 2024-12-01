import type {
	HomePageContactPersonsQueryResult,
	internalGroqTypeReferenceTo,
	SanityImageCrop,
	SanityImageHotspot,
} from './sanity.types.generated';

export * from './sanity.types.generated';

export type ContactPerson = NonNullable<HomePageContactPersonsQueryResult>[0];

interface SanityImage {
	alt: string;
	asset?: {
		_ref: string;
		_type: 'reference';
		_weak?: boolean;
		[internalGroqTypeReferenceTo]?: 'sanity.imageAsset';
	};
	crop?: SanityImageCrop;
	hotspot?: SanityImageHotspot;
}

export interface ExtendedImage extends SanityImage {
	_type: 'extendedImage';
}

export interface MainImage extends SanityImage {
	_type: 'mainImage';
}
