import type { HomePageQueryResult, Stats } from './sanity.types.generated';

type ContactPerson =
	NonNullable<HomePageQueryResult>['content']['contactPersonsSection']['contactPersons'][0];

interface StatsSection {
	stats: (Stats & { _key: string })[];
}

export type {
	AnyImage,
	ExtendedImage,
	MainImage,
	SanityImage,
	SanityImageReference,
} from './image.types';
// oxlint-disable-next-line import/export
export * from './sanity.types.generated';
export type { TrainingTimeSection } from './training-time';

export type { ContactPerson, StatsSection };
