import type { PartnerPageQueryResult } from '@/types/sanity.types';

type PartnerPage = NonNullable<PartnerPageQueryResult['partnerPage']>;
type ReasonsSection = NonNullable<PartnerPage['content']['whySection']>;
type WaysSection = NonNullable<PartnerPage['content']['waysSection']>;
type PartnersSection = NonNullable<PartnerPage['content']['partnersSection']>;
type Inquiry = PartnerPage['inquiry'];
type Sponsor = PartnerPageQueryResult['sponsors'][number];

export type { Inquiry, PartnerPage, PartnersSection, ReasonsSection, Sponsor, WaysSection };
