import type { VenuePageQueryResult } from '@/types/sanity.types';

type VenuePage = NonNullable<VenuePageQueryResult['venuePage']>;
type VenueContent = VenuePage['content'];
type HomeSection = NonNullable<VenueContent['homeSection']>;
type OthersSection = NonNullable<VenueContent['othersSection']>;
type Inquiry = VenuePage['inquiry'];
type Venue = VenuePageQueryResult['venues'][number];
type VenueGroup = Venue['groups'][number];
type VenueLocation = Venue['location'];
type VenueType = Venue['type'];
type FallbackImage = VenuePageQueryResult['fallbackImage'];

export type {
	FallbackImage,
	HomeSection,
	Inquiry,
	OthersSection,
	Venue,
	VenueGroup,
	VenueLocation,
	VenuePage,
	VenueType,
};
