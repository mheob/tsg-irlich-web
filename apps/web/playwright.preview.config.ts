import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

const RETRIES = 1;

/**
 * The smoke suite that runs against a deployed preview with the real dataset behind it.
 *
 * It starts no server and mocks nothing: its job is to notice that real content still renders. It
 * is therefore allowed to fail without blocking a merge — an editor can break it at any time.
 */
export default defineConfig({
	expect: { timeout: 15_000 },
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: true,
	outputDir: './test-results',
	reporter: [['github'], ['html', { open: 'never' }]],
	retries: RETRIES,
	testDir: './e2e/preview',
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
