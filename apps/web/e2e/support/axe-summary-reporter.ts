import { appendFileSync } from 'node:fs';
import process from 'node:process';

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import { AXE_ATTACHMENT, type AxeAttachment } from './axe';

const HEADING = '## Accessibility (axe, WCAG 2.1 AA)';

interface Row {
	helpUrl: string;
	impact: string;
	known: boolean;
	nodes: number;
	projects: Set<string>;
}

/**
 * Sorts two `[key, value]` entries by their key.
 *
 * @param a - The first entry.
 * @param b - The second entry.
 * @returns The comparison of the two keys.
 */
function byKey<T>(a: [string, T], b: [string, T]): number {
	return a[0].localeCompare(b[0]);
}

/**
 * Sorts two strings alphabetically.
 *
 * @param a - The first string.
 * @param b - The second string.
 * @returns The comparison of the two.
 */
function alphabetically(a: string, b: string): number {
	return a.localeCompare(b);
}

/**
 * Collects the axe attachments the accessibility sweep writes and renders them as one markdown
 * table into GitHub's job summary, so the violation list is readable without downloading the
 * `playwright-report` artifact. Outside GitHub Actions (`GITHUB_STEP_SUMMARY` unset) it does
 * nothing — the attachments are in the HTML report either way.
 */
export default class AxeSummaryReporter implements Reporter {
	/** `route` → `rule id` → row, so a retry or the second browser project cannot duplicate a row. */
	private readonly rows = new Map<string, Map<string, Row>>();

	/** `route` → baseline entries that no scan of that route reproduced. */
	private readonly stale = new Map<string, Set<string>>();

	/** A route counts as scanned once its attachment has arrived. */
	private readonly scanned = new Set<string>();

	/**
	 * Picks up the axe attachment a finished test may carry.
	 *
	 * @param test - The finished test.
	 * @param result - Its result, including the attachments.
	 * @returns Nothing.
	 */
	public onTestEnd(test: TestCase, result: TestResult): void {
		const payloads = result.attachments
			.filter((attachment) => attachment.name === AXE_ATTACHMENT && attachment.body)
			.map((attachment) => JSON.parse(String(attachment.body)) as AxeAttachment);

		for (const payload of payloads) {
			this.collect(payload, test.parent.project()?.name ?? 'unknown');
		}
	}

	/**
	 * Appends the rendered summary to GitHub's job summary file.
	 *
	 * @returns Nothing.
	 */
	public onEnd(): void {
		const summaryPath = process.env.GITHUB_STEP_SUMMARY;

		if (!summaryPath || this.scanned.size === 0) {
			return;
		}

		appendFileSync(summaryPath, `${this.render()}\n`, 'utf8');
	}

	/**
	 * Folds one scan into the collected tables.
	 *
	 * @param payload - The attachment written by `expectNoAxeViolations`.
	 * @param project - The Playwright project the scan ran in.
	 * @returns Nothing.
	 */
	private collect(payload: AxeAttachment, project: string): void {
		const seen = this.stale.get(payload.route);

		// A rule that fires on one project but not on the other is not stale — intersect the runs.
		this.stale.set(
			payload.route,
			new Set(seen ? payload.baselined.filter((rule) => seen.has(rule)) : payload.baselined),
		);
		this.scanned.add(payload.route);

		const rows = this.rows.get(payload.route) ?? new Map<string, Row>();

		for (const violation of payload.violations) {
			const row = rows.get(violation.id) ?? {
				helpUrl: violation.helpUrl,
				impact: violation.impact,
				known: violation.known,
				nodes: violation.nodes,
				projects: new Set<string>(),
			};

			row.nodes = Math.max(row.nodes, violation.nodes);
			row.projects.add(project);
			rows.set(violation.id, row);
		}

		if (rows.size > 0) {
			this.rows.set(payload.route, rows);
		}
	}

	/**
	 * Renders the collected scans as markdown.
	 *
	 * @returns The job summary section.
	 */
	private render(): string {
		const lines = [
			HEADING,
			'',
			...(this.rows.size === 0 ? this.renderClean() : this.renderTable()),
		];
		const stale = [...this.stale]
			.flatMap(([route, rules]) => [...rules].map((rule) => `\`${route}\` → \`${rule}\``))
			.toSorted(alphabetically);

		if (stale.length > 0) {
			lines.push(
				'### Baseline entries without a finding',
				'',
				'These rules are listed in `e2e/support/axe-baseline.ts` but were not reported any more.',
				'The entry belongs in the same commit as its fix.',
				'',
				...stale.map((entry) => `- ${entry}`),
				'',
			);
		}

		return lines.join('\n');
	}

	/**
	 * Renders the body for a run without a single violation.
	 *
	 * @returns The markdown lines.
	 */
	private renderClean(): string[] {
		return [`No violations on any of the ${this.scanned.size} scanned routes.`, ''];
	}

	/**
	 * Renders the violation table.
	 *
	 * @returns The markdown lines.
	 */
	private renderTable(): string[] {
		const lines = [
			'| Route | Rule | Impact | Nodes | Projects | Status |',
			'| --- | --- | --- | --- | --- | --- |',
		];

		for (const [route, rows] of [...this.rows].toSorted(byKey)) {
			for (const [id, row] of [...rows].toSorted(byKey)) {
				const projects = [...row.projects].toSorted(alphabetically).join(', ');
				const status = row.known ? 'known (baseline)' : '**new**';

				lines.push(
					`| \`${route}\` | [${id}](${row.helpUrl}) | ${row.impact} | ${row.nodes} | ${projects} | ${status} |`,
				);
			}
		}

		lines.push('', `Scanned: ${this.scanned.size} routes.`, '');

		return lines;
	}
}
