import { env } from '@/lib/env';

/**
 * Returns the canonical base URL for the application depending on the runtime environment.
 *
 * - Uses the VERCEL_PROJECT_PRODUCTION_URL (from Vercel environment) if present.
 * - Falls back to 'https://www.tsg-irlich.de' when in production mode.
 * - Defaults to 'http://localhost:3000' for development.
 *
 * @returns The base URL (protocol and domain) for the current deployment environment.
 *
 * @example
 * const baseUrl = getBaseUrl(); // e.g., "https://mein-projekt.vercel.app"
 */
function getBaseUrl(): string {
	const vercelUrl = env('VERCEL_PROJECT_PRODUCTION_URL');
	if (vercelUrl) {
		return `https://${vercelUrl}`;
	}
	if (env('NODE_ENV') === 'production') {
		return 'https://www.tsg-irlich.de';
	}
	return 'http://localhost:3000';
}

export { getBaseUrl };
