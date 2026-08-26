import process from 'node:process';

import { describe, expect, it } from 'vitest';

import type * as envModule from '@/lib/env';

import { loadWithEnv } from '../../test-utils/env';

type EnvModule = typeof envModule;

describe('validated environment variable access', () => {
	it('returns a valid value unchanged', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			LINEAR_TEAM_ID: 'team-123',
		});

		expect(env('LINEAR_TEAM_ID')).toBe('team-123');
	});

	it('throws with the key name when a required variable is missing', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			LINEAR_TEAM_ID: undefined,
		});

		expect(() => env('LINEAR_TEAM_ID')).toThrow(/LINEAR_TEAM_ID/u);
	});

	it('throws when a value fails its schema', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			NEXT_PUBLIC_SANITY_STUDIO_URL: 'not-a-url',
		});

		expect(() => env('NEXT_PUBLIC_SANITY_STUDIO_URL')).toThrow();
	});

	it('defaults NODE_ENV to development when unset', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			NODE_ENV: undefined,
		});

		expect(env('NODE_ENV')).toBe('development');
	});

	it('defaults the Sanity API version when unset', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			NEXT_PUBLIC_SANITY_API_VERSION: undefined,
		});

		expect(env('NEXT_PUBLIC_SANITY_API_VERSION')).toBe('2025-12-15');
	});

	it('turns an empty SANITY_API_READ_TOKEN into undefined', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			SANITY_API_READ_TOKEN: '',
		});

		expect(env('SANITY_API_READ_TOKEN')).toBeUndefined();
	});

	it('leaves an absent SANITY_API_READ_TOKEN as undefined', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			SANITY_API_READ_TOKEN: undefined,
		});

		expect(env('SANITY_API_READ_TOKEN')).toBeUndefined();
	});

	it('returns undefined for an absent optional variable without throwing', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			NEXT_PUBLIC_SANITY_STUDIO_URL: undefined,
		});

		expect(() => env('NEXT_PUBLIC_SANITY_STUDIO_URL')).not.toThrow();
		expect(env('NEXT_PUBLIC_SANITY_STUDIO_URL')).toBeUndefined();
	});

	it('caches the first read even after process.env changes', async () => {
		const { env } = await loadWithEnv<EnvModule>('@/lib/env', {
			LINEAR_TEAM_ID: 'first-value',
		});

		const first = env('LINEAR_TEAM_ID');
		process.env.LINEAR_TEAM_ID = 'second-value';
		const second = env('LINEAR_TEAM_ID');

		expect(first).toBe('first-value');
		expect(second).toBe('first-value');
	});
});
