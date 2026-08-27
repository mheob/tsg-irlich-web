import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

const RETRIES = 1;

/**
 * The token from Vercel's "Protection Bypass for Automation". Preview deployments sit behind SSO,
 * so without it every request lands on Vercel's login page. The suite skips itself when it is
 * missing rather than reporting a wall of failures.
 */
const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

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
		extraHTTPHeaders: bypassToken
			? { 'x-vercel-protection-bypass': bypassToken, 'x-vercel-set-bypass-cookie': 'true' }
			: {},
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
