/* eslint-disable node/prefer-global/process */

/**
 * Asserts that a value is defined and returns it, throwing an error if undefined.
 * Used to validate required environment variables.
 *
 * @param value - The value to check
 * @param errorMessage - The error message to throw if value is undefined
 * @returns The value if defined
 * @throws {Error} Error if value is undefined
 * @example
 * ```ts
 * const requiredValue = assertValue(process.env.REQUIRED_VAR, 'Missing REQUIRED_VAR');
 * ```
 */
function assertValue<T>(value: T | undefined, errorMessage: string): T {
	if (!value) throw new Error(errorMessage);
	return value;
}

/**
 * The Sanity Studio dataset to use.
 * This is loaded from the `SANITY_STUDIO_DATASET` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const dataset = assertValue(
	process.env.SANITY_STUDIO_DATASET,
	'Missing environment variable: SANITY_STUDIO_DATASET',
);

/**
 * The Sanity Studio project ID to use.
 * This is loaded from the `SANITY_STUDIO_PROJECT_ID` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const projectId = assertValue(
	process.env.SANITY_STUDIO_PROJECT_ID,
	'Missing environment variable: SANITY_STUDIO_PROJECT_ID',
);

/**
 * The Sanity Studio API version to use.
 * This is loaded from the `SANITY_STUDIO_VERSION` environment variable, or defaults to '2025-09-05'
 * if the environment variable is missing.
 *
 * @see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = process.env.SANITY_STUDIO_VERSION ?? '2025-09-05';
