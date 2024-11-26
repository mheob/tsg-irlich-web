import type { HomePageContactPersonsQueryResult } from './sanity.types.generated';

export * from './sanity.types.generated';

export type ContactPerson = NonNullable<HomePageContactPersonsQueryResult>[0];
