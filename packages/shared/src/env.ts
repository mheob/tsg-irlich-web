/* eslint-disable node/prefer-global/process */

import 'dotenv/config';

function assertValue<T>(value: T | undefined, errorMessage: string): T {
	if (!value) throw new Error(errorMessage);
	return value;
}

/**
 * The Sanity Studio dataset to use.
 * This is loaded from the `SANITY_API_DATASET` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const dataset = assertValue(
	process.env.SANITY_API_DATASET,
	'Missing environment variable: SANITY_API_DATASET',
);

/**
 * The Sanity Studio project ID to use.
 * This is loaded from the `SANITY_API_PROJECT_ID` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const projectId = assertValue(
	process.env.SANITY_API_PROJECT_ID,
	'Missing environment variable: SANITY_API_PROJECT_ID',
);

/**
 * The Sanity Studio API version to use.
 * This is loaded from the `SANITY_API_VERSION` environment variable, or defaults to '2024-08-22'
 * if the environment variable is missing.
 *
 * @see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = process.env.SANITY_API_VERSION ?? '2024-08-22';
