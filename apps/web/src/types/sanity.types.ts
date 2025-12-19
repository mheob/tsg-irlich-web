import type {
	GroupDance,
	HomePageQueryResult,
	internalGroqTypeReferenceTo,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
	Stats,
} from './sanity.types.generated';

export * from './sanity.types.generated';
export * from './training-time';

export type ContactPerson =
	NonNullable<HomePageQueryResult>['content']['contactPersonsSection']['contactPersons'][0];

export interface Groups {
	groups: Array<Omit<GroupDance, 'slug'> & { slug: string }>;
}

export interface StatsSection {
	stats: Array<Stats & { _key: string }>;
}

export interface SanityImage {
	_type: 'image';
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
