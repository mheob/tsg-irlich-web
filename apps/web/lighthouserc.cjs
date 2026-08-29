/**
 * Lighthouse CI, run against a deployed Vercel preview by `.github/workflows/lighthouse.yml`.
 *
 * The mocked Playwright suite deliberately does not host this: it serves the app from a local
 * `next start`, without the CDN, the image optimizer or the real payloads, so every number it
 * produced would describe the runner rather than the site.
 *
 * CommonJS on purpose — `apps/web` is `"type": "module"`, and Lighthouse CI `require()`s its config
 * file. `.cjs` is the first name it looks for.
 */

'use strict';

const process = require('node:process');

/** How often each URL is measured. Lighthouse CI reports the median run of the three. */
const RUNS_PER_URL = 3;

/** The metric budgets, in the units Lighthouse reports them in (milliseconds, and CLS unitless). */
const LARGEST_CONTENTFUL_PAINT_MS = 2500;
const TOTAL_BLOCKING_TIME_MS = 300;
const CUMULATIVE_LAYOUT_SHIFT = 0.1;

/** The performance score below which the run is flagged — never fatal, see the assertions below. */
const MIN_PERFORMANCE_SCORE = 0.9;

/**
 * The base URL of the deployment under test. The workflow passes the preview URL that triggered it;
 * locally, point it at whatever you want to measure.
 */
const baseUrl = process.env.LHCI_BASE_URL ?? 'http://localhost:3000';

/**
 * Vercel's "Protection Bypass for Automation" token, the same one the preview Playwright suite
 * uses. Preview deployments sit behind Vercel's SSO, so without it Lighthouse would score the login
 * page.
 */
const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * The routes worth a full audit: the home page (the heaviest one, hero image plus the animated
 * counters), one prose page, one card overview, the news list and the contact form.
 *
 * Deliberately no dynamic route — a department or an article can only be reached through a slug
 * that lives in the dataset, which is why the preview smoke suite clicks its way there instead of
 * hard-coding one. Lighthouse takes URLs and nothing else, so those routes stay with Playwright.
 */
const ROUTES = ['/', '/verein', '/angebot', '/news', '/kontakt'];

module.exports = {
	ci: {
		collect: {
			numberOfRuns: RUNS_PER_URL,
			// No `preset`: Lighthouse defaults to an emulated mid-range phone on a throttled
			// connection, which is both the harsher measurement and the one most of the club's
			// visitors live in. `preset: 'desktop'` would flatter every number.
			settings: {
				// Vercel answers every preview deployment with `X-Robots-Tag: noindex`, which is the
				// point of a preview and says nothing about what production serves. The audit can
				// never pass here, and it carries a third of the SEO category — so it is skipped
				// rather than merely un-asserted: an assertion set to `off` still leaves the failing
				// audit inside the category score, which is what dropped SEO to 0.66 on the first
				// real run. What robots.txt actually serves is covered by `robots.ts` and its test.
				skipAudits: ['is-crawlable'],
				...(bypassToken && {
					extraHeaders: {
						'x-vercel-protection-bypass': bypassToken,
						'x-vercel-set-bypass-cookie': 'true',
					},
				}),
			},
			url: ROUTES.map((route) => new URL(route, baseUrl).toString()),
		},
		assert: {
			assertions: {
				'categories:accessibility': ['error', { minScore: 1 }],
				'categories:best-practices': ['error', { minScore: 1 }],
				'categories:seo': ['error', { minScore: 1 }],

				// A GitHub runner shares its CPU with whatever else the machine is doing, and the
				// performance score moves by around ten points between two identical runs. A hard gate
				// on it would flap, so it reports and the metric budgets below say where it hurts.
				'categories:performance': ['warn', { minScore: MIN_PERFORMANCE_SCORE }],
				'cumulative-layout-shift': ['warn', { maxNumericValue: CUMULATIVE_LAYOUT_SHIFT }],
				'largest-contentful-paint': ['warn', { maxNumericValue: LARGEST_CONTENTFUL_PAINT_MS }],
				'total-blocking-time': ['warn', { maxNumericValue: TOTAL_BLOCKING_TIME_MS }],

				// The same defect `KNOWN_VIOLATIONS` in `e2e/support/axe-baseline.ts` tolerates: the
				// unnamed privacy checkbox on `/`, `/kontakt` and `/kontakt/feedback`, removed by
				// WEB-302. Lighthouse runs axe too, so it reports it a second time. Delete this line
				// together with the baseline entry.
				'aria-toggle-field-name': 'off',
			},
		},
		upload: {
			// Not `temporary-public-storage`: that uploads every report to a Google-hosted bucket
			// anyone with the link can read. The reports stay in the workspace and leave CI as a
			// GitHub artifact instead.
			outputDir: './lighthouse-report',
			target: 'filesystem',
		},
	},
};
