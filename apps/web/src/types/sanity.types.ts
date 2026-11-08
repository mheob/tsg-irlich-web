import type { HomePageQueryResult } from './sanity.types.generated';

type ContactPerson =
	NonNullable<HomePageQueryResult>['content']['contactPersonsSection']['contactPersons'][0];

export type { AnyImage, SanityImage, SanityImageReference } from './image.types';
export * from './sanity.types.generated';
export type { TrainingTimeSection } from './training-time';

export type { ContactPerson };
