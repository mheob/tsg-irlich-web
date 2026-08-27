import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 3100;
const RETRIES_IN_CI = 2;
const WEB_SERVER_TIMEOUT_MS = 180_000;

const isCi = Boolean(process.env.CI);

// Dummy credentials for every service the mocks intercept, plus the two public Sanity values the
// recorded fixtures are keyed by. Loading them here keeps the suite runnable without `.env.local`.
process.loadEnvFile('.env.e2e');

// Recording talks to the real Sanity API, which needs the developer's own read token.
if (process.env.E2E_RECORD === '1') {
	process.loadEnvFile('.env.local');
}

const baseURL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
	expect: { timeout: 10_000 },
	forbidOnly: isCi,
	fullyParallel: true,
	outputDir: './test-results',
	reporter: isCi
		? [['github'], ['html', { open: 'never' }]]
		: [['list'], ['html', { open: 'never' }]],
	retries: isCi ? RETRIES_IN_CI : 0,
	testDir: './e2e/specs',
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 14'] },
		},
	],
	webServer: {
		// Always the production server: Next.js allows only one dev server per directory, so a dev
		// server here would collide with the one a developer already has running. Locally the server
		// is reused between runs (see `reuseExistingServer`), so the build cost is paid once.
		command: `pnpm run build && pnpm exec next start --port ${E2E_PORT}`,
		env: {
			...process.env,
			E2E_MOCK: '1',
			// The mocks have to be installed before any application module is imported, and they have
			// to cover the build as well: `generateStaticParams` queries Sanity while the pages are
			// generated. Node's built-in type stripping runs the preload as-is.
			NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ./e2e/mocks/preload.ts`.trim(),
		},
		reuseExistingServer: !isCi,
		timeout: WEB_SERVER_TIMEOUT_MS,
		url: baseURL,
	},
});
