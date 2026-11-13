import type { VenuePageQueryResult } from '@/types/sanity.types';

type VenuePage = NonNullable<VenuePageQueryResult['venuePage']>;
type VenueContent = VenuePage['content'];
type HomeSection = NonNullable<VenueContent['homeSection']>;
type OthersSection = NonNullable<VenueContent['othersSection']>;
type TurfBox = NonNullable<HomeSection['turfBox']>;
type Inquiry = VenuePage['inquiry'];
type Venue = VenuePageQueryResult['venues'][number];
type VenueGroup = Venue['groups'][number];
type VenueLocation = Venue['location'];
type VenueType = Venue['type'];
type FallbackImage = VenuePageQueryResult['fallbackImage'];
type ContactPerson = VenueContent['contactPersonsSection']['contactPersons'][number];

export type {
	ContactPerson,
	FallbackImage,
	HomeSection,
	Inquiry,
	OthersSection,
	TurfBox,
	Venue,
	VenueGroup,
	VenueLocation,
	VenuePage,
	VenueType,
};
