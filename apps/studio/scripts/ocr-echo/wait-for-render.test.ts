// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import type { RenderState, SwapTarget } from './swap-store';
import { waitForRender } from './wait-for-render';
import type { WaitDeps } from './wait-for-render';

const OLD_PDF = 'file-1111111111111111111111111111111111111111-pdf';
const NEW_PDF = 'file-2222222222222222222222222222222222222222-pdf';

const TARGET: SwapTarget = {
	documentId: 'echo-2024',
	id: 'drafts.echo-2024',
	kind: 'draft',
	pdf: { assetId: OLD_PDF, originalFilename: 'tsg-echo-2024.pdf', sha1hash: 'abc' },
	render: { pdfRef: OLD_PDF, source: OLD_PDF, status: 'done', textLength: 2812 },
	rev: 'rev-1',
};

const NOT_CLAIMED: RenderState = {
	pdfRef: NEW_PDF,
	source: OLD_PDF,
	status: 'done',
	textLength: 2812,
};
const PENDING: RenderState = {
	pdfRef: NEW_PDF,
	source: NEW_PDF,
	status: 'pending',
	textLength: 2812,
};
const DONE: RenderState = { pdfRef: NEW_PDF, source: NEW_PDF, status: 'done', textLength: 64_066 };

/**
 * Wait dependencies over a fake clock that `wait` moves forward. `readRender` answers with the given
 * states one after the other and repeats the last one.
 *
 * @param states - The render states, in the order the polls see them.
 * @returns The spies.
 */
function createDeps(...states: (RenderState | undefined)[]) {
	let now = 0;
	const answers = [...states];
	return {
		now: () => now,
		// oxlint-disable-next-line typescript/require-await -- the fake answers at once
		readRender: vi.fn<WaitDeps['readRender']>(async () =>
			answers.length > 1 ? answers.shift() : answers[0],
		),
		// oxlint-disable-next-line typescript/require-await -- the fake clock moves at once
		wait: vi.fn<WaitDeps['wait']>(async (ms) => {
			now += ms;
		}),
	};
}

describe('waiting for the render', () => {
	it('polls every five seconds until the render of the new PDF is done', async () => {
		const deps = createDeps(NOT_CLAIMED, PENDING, DONE);

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			ok: true,
			textLength: 64_066,
		});
		expect(deps.wait.mock.calls).toStrictEqual([[5000], [5000]]);
		expect(deps.readRender).toHaveBeenCalledWith(TARGET);
	});

	it('reports a failed render with its reason', async () => {
		const deps = createDeps({ ...PENDING, error: 'Zeitlimit überschritten', status: 'failed' });

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			error: 'Render gescheitert: Zeitlimit überschritten',
			ok: false,
		});
	});

	it('gives up when the render does not start within two minutes', async () => {
		const deps = createDeps(NOT_CLAIMED);

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			error:
				'Der Render-Webhook hat nach 2 Minuten nicht ausgelöst. Den Webhook „TSG-Echo Seiten erzeugen“ des Datasets prüfen.',
			ok: false,
		});
		expect(deps.now()).toBe(120_000);
	});

	it('gives up on a render still running after fifteen minutes', async () => {
		const deps = createDeps(PENDING);

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			error: 'Der Render ist nach 15 Minuten nicht fertig.',
			ok: false,
		});
		expect(deps.now()).toBe(900_000);
	});

	it('stops when someone replaced the PDF meanwhile', async () => {
		const deps = createDeps({
			...PENDING,
			pdfRef: 'file-3333333333333333333333333333333333333333-pdf',
		});

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			error: 'Die PDF der Ausgabe wurde inzwischen ersetzt.',
			ok: false,
		});
	});

	it('stops when the issue is gone', async () => {
		// oxlint-disable-next-line unicorn/no-useless-undefined -- a gone issue reads as undefined
		const deps = createDeps(undefined);

		await expect(waitForRender(TARGET, NEW_PDF, deps)).resolves.toStrictEqual({
			error: 'Die Ausgabe ist verschwunden.',
			ok: false,
		});
	});
});
