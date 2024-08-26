/* eslint-disable node/prefer-global/process */

function assertValue<T>(value: T | undefined, errorMessage: string): T {
	if (!value) throw new Error(errorMessage);
	return value;
}

export const dataset = assertValue(
	process.env.SANITY_STUDIO_DATASET,
	'Missing environment variable: SANITY_STUDIO_DATASET',
);

export const projectId = assertValue(
	process.env.SANITY_STUDIO_PROJECT_ID,
	'Missing environment variable: SANITY_STUDIO_PROJECT_ID',
);

/**
 * see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = process.env.SANITY_API_VERSION ?? '2022-03-07';
