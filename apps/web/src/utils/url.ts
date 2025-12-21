import process from 'node:process';

import { GOOGLE_MAPS_URL } from '@/constants/urls';
import type { TrainingTimeSection } from '@/types/sanity.types';

/**
 * Returns the canonical base URL for the application depending on the runtime environment.
 *
 * - Uses the VERCEL_PROJECT_PRODUCTION_URL (from Vercel environment) if present.
 * - Falls back to 'https://next.tsg-irlich.de' when in production mode.
 * - Defaults to 'http://localhost:3000' for development.
 *
 * @returns The base URL (protocol and domain) for the current deployment environment.
 *
 * @example
 * const baseUrl = getBaseUrl(); // e.g., "https://mein-projekt.vercel.app"
 */
export function getBaseUrl(): string {
	let baseUrl = 'http://localhost:3000';
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	} else if (process.env.NODE_ENV === 'production') {
		baseUrl = 'https://next.tsg-irlich.de';
	}
	return baseUrl;
}

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
