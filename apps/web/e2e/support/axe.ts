import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';

import { KNOWN_VIOLATIONS } from './axe-baseline';

/**
 * The rule sets the sweep runs: WCAG 2.1, level A and AA — the conformance target the club's
 * accessibility statement names. `best-practice` and the experimental rules stay out; they report
 * advice rather than a conformance failure, and a suite that blocks on advice gets muted.
 */
const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** The name the helper attaches its result under and the summary reporter reads it back by. */
export const AXE_ATTACHMENT = 'axe-results';

/** The payload `AXE_ATTACHMENT` carries, shared with the summary reporter. */
export interface AxeAttachment {
	/** The route template the scan ran against. */
	route: string;
	/** The URL that template resolved to in this run. */
	url: string;
	/** Baseline entries this scan did not reproduce — candidates for deletion. */
	baselined: string[];
	violations: AxeAttachmentViolation[];
}

export interface AxeAttachmentViolation {
	id: string;
	impact: string;
	help: string;
	helpUrl: string;
	/** Whether the baseline already lists this rule for this route. */
	known: boolean;
	nodes: number;
	targets: string[];
}

/**
 * Runs axe against the page as it currently stands and fails the test on every violation the
 * baseline does not already list.
 *
 * @param page - The page to scan, already settled.
 * @param testInfo - The running test, which the full axe result is attached to.
 * @param route - The route *template* (`/news/[category]/[slug]`), not the resolved URL: the
 *   dynamic pages are reached by clicking through the overviews, so their slugs follow the recorded
 *   fixtures and would make a useless baseline key.
 * @returns Nothing; an unbaselined violation fails the test.
 */
export async function expectNoAxeViolations(
	page: Page,
	testInfo: TestInfo,
	route: string,
): Promise<void> {
	const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA_TAGS).analyze();
	const known = new Set(KNOWN_VIOLATIONS[route]);

	const attachment: AxeAttachment = {
		route,
		url: page.url(),
		baselined: [...known].filter((rule) => !results.violations.some(({ id }) => id === rule)),
		violations: results.violations.map((violation) => ({
			id: violation.id,
			impact: violation.impact ?? 'unknown',
			help: violation.help,
			helpUrl: violation.helpUrl,
			known: known.has(violation.id),
			nodes: violation.nodes.length,
			targets: violation.nodes.map((node) => node.target.join(' ')),
		})),
	};

	await testInfo.attach(AXE_ATTACHMENT, {
		body: JSON.stringify(attachment, undefined, 2),
		contentType: 'application/json',
	});

	const unexpected = attachment.violations
		.filter((violation) => !violation.known)
		.map(
			(violation) =>
				`${violation.id} (${violation.impact}, ${violation.nodes} node(s)): ${violation.help}`,
		);

	expect(unexpected, `${route} must not report an unbaselined WCAG 2.1 AA violation`).toEqual([]);
}
