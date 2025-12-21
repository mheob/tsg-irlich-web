import type { GroupDance, HomePageQueryResult, Stats } from './sanity.types.generated';

export type {
	AnyImage,
	ExtendedImage,
	MainImage,
	SanityImage,
	SanityImageReference,
} from './image.types';
export * from './sanity.types.generated';
export type { TrainingTimeSection } from './training-time';

export type ContactPerson =
	NonNullable<HomePageQueryResult>['content']['contactPersonsSection']['contactPersons'][0];

export interface Groups {
	groups: Array<Omit<GroupDance, 'slug'> & { slug: string }>;
}

export interface StatsSection {
	stats: Array<Stats & { _key: string }>;
}
