import type { VolunteerPageQueryResult } from '@/types/sanity.types';

type VolunteerPage = NonNullable<VolunteerPageQueryResult['volunteerPage']>;
type VolunteerContent = VolunteerPage['content'];
type ReasonsSection = NonNullable<VolunteerContent['whySection']>;
type VoicesSection = NonNullable<VolunteerContent['voicesSection']>;
type AreasSection = NonNullable<VolunteerContent['areasSection']>;
type PositionsSection = NonNullable<VolunteerContent['positionsSection']>;
type Inquiry = VolunteerPage['inquiry'];
type Position = VolunteerPageQueryResult['positions'][number];
type Testimonial = NonNullable<VoicesSection['testimonials']>[number];

export type {
	AreasSection,
	Inquiry,
	Position,
	PositionsSection,
	ReasonsSection,
	Testimonial,
	VoicesSection,
	VolunteerPage,
};
