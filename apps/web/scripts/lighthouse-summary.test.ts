import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { COMMENT_MARKER, formatSummary, main, readRouteResults } from './lighthouse-summary';

interface ReportOptions {
	categories?: Record<string, number | null>;
	metrics?: Record<string, number>;
}

function buildReport({ categories = {}, metrics = {} }: ReportOptions): unknown {
	return {
		audits: Object.fromEntries(
			Object.entries(metrics).map(([audit, numericValue]) => [audit, { numericValue }]),
		),
		categories: Object.fromEntries(
			Object.entries(categories).map(([id, score]) => [id, { score }]),
		),
	};
}

const FAST_REPORT = buildReport({
	categories: { accessibility: 1, 'best-practices': 1, performance: 0.93, seo: 1 },
	metrics: {
		'cumulative-layout-shift': 0.012,
		'largest-contentful-paint': 2140,
		'total-blocking-time': 80,
	},
});

const SLOW_REPORT = buildReport({
	categories: { accessibility: 0.98, 'best-practices': 0.96, performance: 0.42, seo: 1 },
	metrics: {
		'cumulative-layout-shift': 0.31,
		'largest-contentful-paint': 3260.4,
		'total-blocking-time': 712.6,
	},
});

describe('lighthouse summary', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'lighthouse-summary-'));
	});

	afterEach(async () => {
		await rm(directory, { force: true, recursive: true });
	});

	/**
	 * Writes one artifact the way `measure` uploads it: a folder with the reports and a manifest
	 * whose paths name the runner that wrote them.
	 *
	 * @param name - The artifact's folder.
	 * @param runs - One report per run, with the URL it measured.
	 */
	async function writeArtifact(
		name: string,
		runs: readonly { isRepresentativeRun: boolean; report: unknown; url: string }[],
	): Promise<void> {
		const folder = path.join(directory, name);
		await mkdir(folder, { recursive: true });

		const manifest = await Promise.all(
			runs.map(async ({ isRepresentativeRun, report, url }, index) => {
				const file = `run-${index}.report.json`;
				await writeFile(path.join(folder, file), JSON.stringify(report));
				return {
					isRepresentativeRun,
					jsonPath: `/home/runner/work/web/apps/web/lighthouse-report/${file}`,
					url,
				};
			}),
		);
		await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest));
	}

	it('reads the representative run of every artifact, ordered by route', async () => {
		await writeArtifact('lighthouse-report-verein', [
			{ isRepresentativeRun: false, report: FAST_REPORT, url: 'https://preview.example/verein' },
			{ isRepresentativeRun: true, report: SLOW_REPORT, url: 'https://preview.example/verein' },
		]);
		await writeArtifact('lighthouse-report-home', [
			{ isRepresentativeRun: true, report: FAST_REPORT, url: 'https://preview.example/' },
		]);

		await expect(readRouteResults(directory)).resolves.toStrictEqual([
			{ metrics: [2140, 80, 0.012], route: '/', scores: [0.93, 1, 1, 1] },
			{ metrics: [3260.4, 712.6, 0.31], route: '/verein', scores: [0.42, 0.98, 0.96, 1] },
		]);
	});

	it('leaves out what a report or a manifest does not hold', async () => {
		await writeArtifact('lighthouse-report-news', [
			{
				isRepresentativeRun: true,
				report: buildReport({ categories: { performance: null } }),
				url: 'https://preview.example/news',
			},
		]);
		await writeFile(
			path.join(directory, 'lighthouse-report-news', 'manifest.json'),
			JSON.stringify([
				{
					isRepresentativeRun: true,
					jsonPath: '/runner/run-0.report.json',
					url: 'https://preview.example/news',
				},
				{ isRepresentativeRun: true, jsonPath: 42, url: 'https://preview.example/kontakt' },
				'no entry',
			]),
		);
		await mkdir(path.join(directory, 'lighthouse-report-kontakt'));
		await writeFile(path.join(directory, 'lighthouse-report-kontakt', 'manifest.json'), '{}');

		await expect(readRouteResults(directory)).resolves.toStrictEqual([
			{
				metrics: [undefined, undefined, undefined],
				route: '/news',
				scores: [undefined, undefined, undefined, undefined],
			},
		]);
	});

	it('finds nothing in a directory that does not exist', async () => {
		await expect(readRouteResults(path.join(directory, 'missing'))).resolves.toStrictEqual([]);
	});

	it('formats one row per route with the bands of Lighthouse and the Core Web Vitals', () => {
		const summary = formatSummary(
			[
				{ metrics: [2140, 80, 0.012], route: '/', scores: [0.93, 1, 1, 1] },
				{ metrics: [3260.4, 712.6, 0.31], route: '/verein', scores: [0.42, 0.98, 0.5, 1] },
				{
					metrics: [undefined, undefined, undefined],
					route: '/news',
					scores: [undefined, undefined, undefined, undefined],
				},
			],
			{ baseUrl: 'https://preview.example', runUrl: 'https://github.com/runs/1' },
		);

		expect(summary.split('\n')).toStrictEqual([
			COMMENT_MARKER,
			'### Lighthouse',
			'',
			'The median run of every route on https://preview.example, on an emulated mid-range phone.',
			'',
			'| Route | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |',
			'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
			'| `/` | 🟢 93 | 🟢 100 | 🟢 100 | 🟢 100 | 🟢 2.1 s | 🟢 80 ms | 🟢 0.012 |',
			'| `/verein` | 🔴 42 | 🟢 98 | 🟠 50 | 🟢 100 | 🟠 3.3 s | 🔴 713 ms | 🔴 0.310 |',
			'| `/news` | – | – | – | – | – | – | – |',
			'',
			'Scores use the bands of Lighthouse, the metrics those of the Core Web Vitals. The full reports are in the [artifacts of this run](https://github.com/runs/1).',
			'',
		]);
	});

	it('names neither the deployment nor the run when it does not know them', () => {
		const summary = formatSummary([{ metrics: [], route: '/', scores: [] }], {});

		expect(summary).toContain('The median run of every route, on an emulated mid-range phone.');
		expect(summary).toContain('those of the Core Web Vitals.\n');
		expect(summary).not.toContain('artifacts of this run');
	});

	it('prints the summary of a directory with the deployment and the run from the environment', async () => {
		await writeArtifact('lighthouse-report-home', [
			{ isRepresentativeRun: true, report: FAST_REPORT, url: 'https://preview.example/' },
		]);
		const output: string[] = [];

		await main(
			[directory],
			{ LIGHTHOUSE_BASE_URL: 'https://preview.example', LIGHTHOUSE_RUN_URL: '' },
			(text) => {
				output.push(text);
			},
		);

		expect(output).toHaveLength(1);
		expect(output[0]).toContain(' on https://preview.example,');
		expect(output[0]).not.toContain('artifacts of this run');
	});

	it('prints nothing when there is no report', async () => {
		const output: string[] = [];

		await main([directory], {}, (text) => {
			output.push(text);
		});

		expect(output).toStrictEqual([]);
	});

	it('refuses to run without a directory', async () => {
		await expect(main([], {}, vi.fn<(text: string) => void>())).rejects.toThrow(
			'Usage: node lighthouse-summary.ts <reports-dir>',
		);
	});
});
