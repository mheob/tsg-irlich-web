import type { ValuesPageQueryResult } from '@/types/sanity.types';

type ValuesPage = NonNullable<ValuesPageQueryResult>;
type ValuesContent = ValuesPage['content'];
type AboutSection = NonNullable<ValuesContent['aboutSection']>;
type ValuesSection = NonNullable<ValuesContent['valuesSection']>;
type ClubValue = ValuesSection['values'][number];
type JoinSection = NonNullable<ValuesContent['joinSection']>;

export type { ClubValue, AboutSection, JoinSection, ValuesPage, ValuesSection };
