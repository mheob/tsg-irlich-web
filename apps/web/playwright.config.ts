import process from 'node:process';

import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

const E2E_PORT = 3100;
const RETRIES_IN_CI = 2;
const WEB_SERVER_TIMEOUT_MS = 180_000;
const SCREENSHOT_DIFF_RATIO = 0.005;

const isCi = Boolean(process.env.CI);

// Recording talks to the real Sanity API, which needs the developer's own read token. `.env.local`
// has to be loaded first: `loadEnvFile` never overwrites a variable that is already set, so the
// dummy token would win otherwise.
if (process.env.E2E_RECORD === '1') {
	process.loadEnvFile('.env.local');
}

// Dummy credentials for every service the mocks intercept, plus the two public Sanity values the
// recorded fixtures are keyed by. Loading them here keeps the suite runnable without `.env.local`.
process.loadEnvFile('.env.e2e');

const baseURL = `http://localhost:${E2E_PORT}`;

// The accessibility sweep attaches its axe result to every test; the last reporter turns those
// attachments into GitHub's job summary and is inert outside Actions.
const reporter: ReporterDescription[] = [
	isCi ? ['github'] : ['list'],
	['html', { open: 'never' }],
	['./e2e/support/axe-summary-reporter.ts'],
];

export default defineConfig({
	expect: {
		timeout: 10_000,
		toHaveScreenshot: {
			// CSS animations, transitions and Web Animations are frozen for the shot; anything
			// mid-flight is rewound to its first frame instead of caught halfway.
			animations: 'disabled',
			// A device pixel ratio of 2 would double every baseline's size without showing a
			// regression the CSS pixels do not already show.
			scale: 'css',
			// Everything runs in one pinned container, so the only expected difference is font
			// antialiasing on a redrawn glyph. Half a percent absorbs that and stays far below the
			// footprint of any layout shift.
			maxDiffPixelRatio: SCREENSHOT_DIFF_RATIO,
		},
	},
	forbidOnly: isCi,
	fullyParallel: true,
	outputDir: './test-results',
	reporter,
	retries: isCi ? RETRIES_IN_CI : 0,
	// Baselines are only ever produced on Linux, so the platform suffix Playwright appends by
	// default would be noise. `visual.spec.ts` skips itself everywhere else.
	snapshotPathTemplate: './e2e/__screenshots__/{projectName}/{arg}{ext}',
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
		// server here would collide with the one a developer already has running.
		command: `pnpm run build && pnpm exec next start --port ${E2E_PORT}`,
		env: {
			...process.env,
			E2E_MOCK: '1',
			// The mocks have to be installed before any application module is imported, and they have
			// to cover the build as well: `generateStaticParams` queries Sanity while the pages are
			// generated. Node's built-in type stripping runs the preload as-is.
			NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ./e2e/mocks/preload.ts`.trim(),
		},
		// A server already listening on the port cannot be checked for the mock preload, and one
		// without it would answer from the real Sanity API — quietly, and the suite would still pass.
		// Reuse is therefore opt-in with `E2E_REUSE_SERVER=1` while writing specs, never the default.
		reuseExistingServer: !isCi && process.env.E2E_REUSE_SERVER === '1',
		timeout: WEB_SERVER_TIMEOUT_MS,
		url: baseURL,
	},
});
