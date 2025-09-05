import type {
	GroupDance,
	HomePageQueryResult,
	internalGroqTypeReferenceTo,
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

interface SanityImage {
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

export interface ExtendedImage extends SanityImage {
	_type: 'extendedImage';
}

export interface MainImage extends SanityImage {
	_type: 'mainImage';
}
