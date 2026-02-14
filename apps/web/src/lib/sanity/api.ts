/* eslint-disable node/prefer-global/process -- Next.js requires direct process.env access for NEXT_PUBLIC_* build-time inlining */

/**
 * Asserts that a value is defined, throwing an error if it's undefined.
 * Used to validate environment variables at runtime.
 *
 * @param value - The value to check
 * @param errorMessage - The error message to throw if the value is undefined
 * @returns The value if it's defined
 * @throws {Error} If the value is undefined
 */
function assertValue<T>(value: T | undefined, errorMessage: string): T {
	if (!value) throw new Error(errorMessage);
	return value;
}

/**
 * The Sanity dataset to use.
 * This is loaded from the `NEXT_PUBLIC_SANITY_DATASET` environment variable.
 * If the environment variable is missing, an error will be thrown.
 *
 * Note: Uses process.env directly for Next.js build-time inlining of NEXT_PUBLIC_* variables.
 */
export const dataset = assertValue(
	process.env.NEXT_PUBLIC_SANITY_DATASET,
	'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET',
);

/**
 * The Sanity project ID to use.
 * This is loaded from the `NEXT_PUBLIC_SANITY_PROJECT_ID` environment variable.
 * If the environment variable is missing, an error will be thrown.
 *
 * Note: Uses process.env directly for Next.js build-time inlining of NEXT_PUBLIC_* variables.
 */
export const projectId = assertValue(
	process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID',
);

/**
 * The Sanity API version to use.
 * This is loaded from the `NEXT_PUBLIC_SANITY_API_VERSION` environment variable, or defaults to '2025-12-15'
 * if the environment variable is missing.
 *
 * Note: Uses process.env directly for Next.js build-time inlining of NEXT_PUBLIC_* variables.
 *
 * @see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2025-12-15';

/**
 * The URL of the Sanity Studio.
 * This is loaded from the `NEXT_PUBLIC_SANITY_STUDIO_URL` environment variable,
 * or defaults to 'http://localhost:3333' if the environment variable is missing.
 *
 * Note: Uses process.env directly for Next.js build-time inlining of NEXT_PUBLIC_* variables.
 */
export const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333';
