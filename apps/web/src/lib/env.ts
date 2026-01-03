import process from 'node:process';

import { z } from 'zod';

// Individual schemas for lazy validation
const schemas = {
	CLEVERREACH_CLIENT_ID: z.string().min(1, 'Missing CLEVERREACH_CLIENT_ID'),
	CLEVERREACH_CLIENT_SECRET: z.string().min(1, 'Missing CLEVERREACH_CLIENT_SECRET'),
	CLEVERREACH_FORM_ID: z.string().min(1, 'Missing CLEVERREACH_FORM_ID'),
	CLEVERREACH_LIST_ID: z.string().min(1, 'Missing CLEVERREACH_LIST_ID'),
	LINEAR_API_KEY: z.string().min(1, 'Missing LINEAR_API_KEY'),
	LINEAR_ASSIGNEE_ID: z.string().min(1, 'Missing LINEAR_ASSIGNEE_ID'),
	LINEAR_LABEL_ID: z.string().min(1, 'Missing LINEAR_LABEL_ID'),
	LINEAR_TEAM_ID: z.string().min(1, 'Missing LINEAR_TEAM_ID'),
	NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2025-12-15'),
	NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, 'Missing NEXT_PUBLIC_SANITY_DATASET'),
	NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, 'Missing NEXT_PUBLIC_SANITY_PROJECT_ID'),
	NEXT_PUBLIC_SANITY_STUDIO_URL: z.url().optional(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	RESEND_API_KEY: z.string().min(1, 'Missing RESEND_API_KEY'),
	SANITY_API_READ_TOKEN: z.string().min(1, 'Missing SANITY_API_READ_TOKEN'),
	SANITY_REVALIDATE_SECRET: z.string().min(1, 'Missing SANITY_REVALIDATE_SECRET'),
	VERCEL_OIDC_TOKEN: z.string().optional(),
	VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
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
 * @param key - The environment variable key to validate
 * @returns The validated environment variable value
 * @throws {Error} If the environment variable is missing or invalid
 */
export function env<K extends EnvKey>(key: K): EnvValue<K> {
	if (cache.has(key)) {
		return cache.get(key) as EnvValue<K>;
	}

	const schema = schemas[key];
	const result = schema.safeParse(process.env[key]);

	if (!result.success) {
		throw new Error(`Invalid environment variable ${key}: ${z.prettifyError(result.error)}`);
	}

	cache.set(key, result.data);
	return result.data as EnvValue<K>;
}
