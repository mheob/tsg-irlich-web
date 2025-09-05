import { GOOGLE_MAPS_URL } from '@/constants/urls';
import type { TrainingTimeSection } from '@/types/sanity.types';

/**
 * Generates a Google Maps search URL for a given venue location.
 *
 * @param location - The location object containing address details.
 * @param location.city - The city of the venue.
 * @param location.houseNumber - The house number of the venue.
 * @param location.name - The name of the venue.
 * @param location.street - The street of the venue.
 * @param location.zipCode - The zip code of the venue.
 * @returns A URL string that opens the address in Google Maps.
 */
export function printGoogleMapsLink({
	city,
	houseNumber,
	name,
	street,
	zipCode,
}: NonNullable<TrainingTimeSection['venue']['location']>): string {
	const lastLine = [zipCode, city].filter(Boolean).join(' ');
	const parts = [`${name}`, `${street} ${houseNumber}`, lastLine].filter(Boolean);
	const address = parts.join(', ');
	return `${GOOGLE_MAPS_URL}${encodeURIComponent(address)}`;
}
