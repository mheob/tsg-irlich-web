/* eslint-disable node/prefer-global/process */

function assertValue<T>(value: T | undefined, errorMessage: string): T {
	if (value !== undefined) return value;
	throw new Error(errorMessage);
}

export const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export const projectId = assertValue(
	process.env.SANITY_STUDIO_PROJECT_ID,
	'Missing environment variable: SANITY_STUDIO_PROJECT_ID',
);
