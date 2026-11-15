/**
 * Turns the Lighthouse reports of one CI run into a Markdown table (WEB-446).
 *
 * The `measure` jobs of `.github/workflows/lighthouse.yml` upload one artifact per route, each with
 * the HTML and JSON reports of every run and the `manifest.json` Lighthouse CI writes next to them.
 * The `Lighthouse` job downloads all of them into one directory and runs this script on it. The
 * table goes into the job summary and, for the preview of an open pull request, into a comment
 * there, which the marker on its first line lets the next run find and update.
 *
 * Usage: `node apps/web/scripts/lighthouse-summary.ts <reports-dir>`. It prints nothing when the
 * directory holds no report, so a run without measurements shows no empty table.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/** The first line of the table, so a later run finds its pull request comment and updates it. */
const COMMENT_MARKER = '<!-- lighthouse-scores -->';

const PERCENT = 100;
const MS_PER_SECOND = 1000;
const SECONDS_DIGITS = 1;
const SHIFT_DIGITS = 3;

/** The bands of Lighthouse's own report: 90 and up passes, below 50 fails. */
const SCORE_GOOD = 0.9;
const SCORE_POOR = 0.5;

const CATEGORIES = [
	{ id: 'performance', label: 'Performance' },
	{ id: 'accessibility', label: 'Accessibility' },
	{ id: 'best-practices', label: 'Best practices' },
	{ id: 'seo', label: 'SEO' },
] as const;

/** The lab metrics behind the performance score, banded by the Core Web Vitals thresholds. */
const METRICS = [
	{
		audit: 'largest-contentful-paint',
		format: (ms: number) => `${(ms / MS_PER_SECOND).toFixed(SECONDS_DIGITS)} s`,
		good: 2500,
		label: 'LCP',
		poor: 4000,
	},
	{
		audit: 'total-blocking-time',
		format: (ms: number) => `${Math.round(ms)} ms`,
		good: 200,
		label: 'TBT',
		poor: 600,
	},
	{
		audit: 'cumulative-layout-shift',
		format: (shift: number) => shift.toFixed(SHIFT_DIGITS),
		good: 0.1,
		label: 'CLS',
		poor: 0.25,
	},
] as const;

/** The scores and metrics of the representative run of one route. */
interface RouteResult {
	/** The value of each metric, in the order of `METRICS`. */
	metrics: (number | undefined)[];
	route: string;
	/** The score of each category from 0 to 1, in the order of `CATEGORIES`. */
	scores: (number | undefined)[];
}

/** The part of a `manifest.json` entry of Lighthouse CI this script reads. */
interface RepresentativeEntry {
	isRepresentativeRun: true;
	/** The report's path on the runner that wrote it. */
	jsonPath: string;
	url: string;
}

/** Where the table points: the deployment that was measured and the run that holds the reports. */
interface SummaryContext {
	baseUrl?: string;
	runUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/**
 * Lighthouse CI marks the median of the runs per URL as representative; the others are left out.
 *
 * @param entry - One entry of a `manifest.json`.
 * @returns Whether it is the representative run and names its report and URL.
 */
function isRepresentativeEntry(entry: unknown): entry is RepresentativeEntry {
	return (
		isRecord(entry) &&
		entry.isRepresentativeRun === true &&
		typeof entry.jsonPath === 'string' &&
		typeof entry.url === 'string'
	);
}

/**
 * Reads a number below nested keys of a parsed JSON value.
 *
 * @param value - The parsed JSON.
 * @param keys - The keys to follow, outermost first.
 * @returns The number, or `undefined` when a key is missing or the value is no number.
 */
function readNumber(value: unknown, ...keys: string[]): number | undefined {
	let current = value;
	for (const key of keys) {
		if (!isRecord(current)) {
			return undefined;
		}
		current = current[key];
	}
	return typeof current === 'number' ? current : undefined;
}

function getIcon(isGood: boolean, isPoor: boolean): string {
	if (isGood) {
		return '🟢';
	}
	return isPoor ? '🔴' : '🟠';
}

function formatScore(score: number | undefined): string {
	if (score === undefined) {
		return '–';
	}
	return `${getIcon(score >= SCORE_GOOD, score < SCORE_POOR)} ${Math.round(score * PERCENT)}`;
}

function formatMetric(value: number | undefined, metric: (typeof METRICS)[number]): string {
	if (value === undefined) {
		return '–';
	}
	return `${getIcon(value <= metric.good, value > metric.poor)} ${metric.format(value)}`;
}

/**
 * Builds the Markdown of the summary: one row per route, the scores first, then the metrics.
 *
 * @param results - The representative run of every measured route.
 * @param context - The measured deployment and the run that holds the full reports.
 * @returns The Markdown, starting with `COMMENT_MARKER`.
 */
function formatSummary(results: readonly RouteResult[], context: SummaryContext): string {
	const header = [
		'Route',
		...CATEGORIES.map(({ label }) => label),
		...METRICS.map(({ label }) => label),
	];
	const rows = results.map(({ metrics, route, scores }) => [
		`\`${route}\``,
		...scores.map((score) => formatScore(score)),
		...METRICS.map((metric, index) => formatMetric(metrics[index], metric)),
	]);
	const target = context.baseUrl ? ` on ${context.baseUrl}` : '';
	const reports = context.runUrl
		? ` The full reports are in the [artifacts of this run](${context.runUrl}).`
		: '';

	return [
		COMMENT_MARKER,
		'### Lighthouse',
		'',
		`The median run of every route${target}, on an emulated mid-range phone.`,
		'',
		`| ${header.join(' | ')} |`,
		`| --- |${' ---: |'.repeat(header.length - 1)}`,
		...rows.map((cells) => `| ${cells.join(' | ')} |`),
		'',
		`Scores use the bands of Lighthouse, the metrics those of the Core Web Vitals.${reports}`,
		'',
	].join('\n');
}

/**
 * An unset variable and an empty one mean the same: the workflow sets `''` when it has no value.
 *
 * @param value - The variable as the environment holds it.
 * @returns The value, or `undefined` when it is unset or empty.
 */
function nonEmpty(value: string | undefined): string | undefined {
	return value === '' ? undefined : value;
}

async function readJson(file: string): Promise<unknown> {
	return JSON.parse(await readFile(file, 'utf8'));
}

/**
 * Reads the representative run of every route from the reports below a directory. Each artifact
 * keeps its own `manifest.json`; an entry names its report by the path on the runner that wrote it,
 * so the report is looked up next to the manifest instead.
 *
 * @param directory - Where the artifacts were downloaded to, one folder each or all in one.
 * @returns One result per route, ordered by path; empty when the directory holds no report.
 */
async function readRouteResults(directory: string): Promise<RouteResult[]> {
	const files = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
		(): [] => [],
	);
	const manifests = files
		.filter((file) => file.isFile() && file.name === 'manifest.json')
		.map((file) => path.join(file.parentPath, file.name));

	const results = await Promise.all(
		manifests.map(async (manifest) => {
			const entries = await readJson(manifest);
			const representative = (Array.isArray(entries) ? entries : []).filter((entry) =>
				isRepresentativeEntry(entry),
			);

			return Promise.all(
				representative.map(async ({ jsonPath, url }) => {
					const report = await readJson(path.join(path.dirname(manifest), path.basename(jsonPath)));

					return {
						metrics: METRICS.map(({ audit }) =>
							readNumber(report, 'audits', audit, 'numericValue'),
						),
						route: new URL(url).pathname,
						scores: CATEGORIES.map(({ id }) => readNumber(report, 'categories', id, 'score')),
					};
				}),
			);
		}),
	);

	return results.flat().toSorted((first, second) => first.route.localeCompare(second.route));
}

/**
 * Prints the summary of the reports in the directory named by the first argument.
 *
 * @param argv - The arguments after the script: the reports directory.
 * @param env - `LIGHTHOUSE_BASE_URL` and `LIGHTHOUSE_RUN_URL`, both optional.
 * @param write - Receives the Markdown; it is not called when there is no report.
 * @returns Nothing; a missing argument throws.
 */
async function main(
	argv: readonly string[],
	env: Readonly<Record<string, string | undefined>>,
	write: (text: string) => void,
): Promise<void> {
	const [directory] = argv;
	if (!directory) {
		throw new Error('Usage: node lighthouse-summary.ts <reports-dir>');
	}

	const results = await readRouteResults(directory);
	if (results.length === 0) {
		return;
	}

	write(
		formatSummary(results, {
			baseUrl: nonEmpty(env.LIGHTHOUSE_BASE_URL),
			runUrl: nonEmpty(env.LIGHTHOUSE_RUN_URL),
		}),
	);
}

if (import.meta.main) {
	// oxlint-disable-next-line node/no-process-env -- a CLI entry point, the workflow sets both URLs
	await main(process.argv.slice(2), process.env, (text) => {
		process.stdout.write(text);
	});
}

export { COMMENT_MARKER, formatSummary, main, readRouteResults };
