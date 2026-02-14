import { z } from 'zod';

// Individual schemas for lazy validation
const schemas = {
	SANITY_STUDIO_DATASET: z.string().min(1, 'Missing SANITY_STUDIO_DATASET'),
	SANITY_STUDIO_PREVIEW_ORIGIN: z.url().default('http://localhost:3000'),
	SANITY_STUDIO_PROJECT_ID: z.string().min(1, 'Missing SANITY_STUDIO_PROJECT_ID'),
	SANITY_STUDIO_VERSION: z.string().default('2025-09-05'),
} as const;

type EnvKey = keyof typeof schemas;
type EnvValue<K extends EnvKey> = z.infer<(typeof schemas)[K]>;

// Cache for validated values
const cache = new Map<EnvKey, unknown>();

/**
 * Validates and returns a single environment variable.
 * Only validates the requested variable, allowing modules to load
 * even if other environment variables are missing.
 *
 * Note: Uses import.meta.env for Vite/browser compatibility.
 *
 * @param key - The environment variable key to validate
 * @returns The validated environment variable value
 * @throws {Error} If the environment variable is missing or invalid
 */
export function env<K extends EnvKey>(key: K): EnvValue<K> {
	if (cache.has(key)) {
		return cache.get(key) as EnvValue<K>;
	}

	const schema = schemas[key];
	// Use import.meta.env for Vite compatibility (Sanity Studio uses Vite)
	const value = import.meta.env[key];
	const result = schema.safeParse(value);

	if (!result.success) {
		throw new Error(`Invalid environment variable ${key}: ${z.prettifyError(result.error)}`);
	}

	cache.set(key, result.data);
	return result.data as EnvValue<K>;
}

/**
 * The Sanity Studio dataset to use.
 * This is loaded from the `SANITY_STUDIO_DATASET` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const dataset = env('SANITY_STUDIO_DATASET');

/**
 * The Sanity Studio project ID to use.
 * This is loaded from the `SANITY_STUDIO_PROJECT_ID` environment variable.
 * If the environment variable is missing, an error will be thrown.
 */
export const projectId = env('SANITY_STUDIO_PROJECT_ID');

/**
 * The Sanity Studio API version to use.
 * This is loaded from the `SANITY_STUDIO_VERSION` environment variable, or defaults to '2025-09-05'
 * if the environment variable is missing.
 *
 * @see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = env('SANITY_STUDIO_VERSION');
