// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { PROBE_REFERRER_ID, PROBE_TARGET_ID, runTypeSwapProbe } from './probe';
import { createFakeStore } from './test-utils/fake-store';

describe('the type swap probe', () => {
	it('swaps a referenced legacy group, finds the reference intact and cleans up', async () => {
		const { lake, store } = createFakeStore([]);

		await expect(runTypeSwapProbe(store)).resolves.toBe('ok');

		expect(store.createOrReplace.mock.calls.map(([document]) => document._type)).toStrictEqual([
			'group.soccer',
			'person',
		]);
		expect(store.swapType).toHaveBeenCalledWith(
			PROBE_TARGET_ID,
			expect.objectContaining({ _id: PROBE_TARGET_ID, _type: 'group' }),
		);
		expect(lake.size).toBe(0);
	});

	it('creates a referrer whose first affiliation points at the target', async () => {
		const { store } = createFakeStore([]);

		await runTypeSwapProbe(store);

		expect(store.createOrReplace).toHaveBeenCalledWith(
			expect.objectContaining({
				_id: PROBE_REFERRER_ID,
				affiliations: [
					expect.objectContaining({ team: { _ref: PROBE_TARGET_ID, _type: 'reference' } }),
				],
			}),
		);
	});

	it('returns the message Sanity rejects the swap with, and still cleans up', async () => {
		const { lake, store } = createFakeStore([]);
		const message = `Document "${PROBE_TARGET_ID}" cannot be deleted as there are references to it from "${PROBE_REFERRER_ID}"`;
		store.swapType.mockRejectedValueOnce(new Error(message));

		await expect(runTypeSwapProbe(store)).resolves.toBe(message);

		expect(lake.size).toBe(0);
		expect(store.deleteDocument.mock.calls.slice(-2)).toStrictEqual([
			[PROBE_REFERRER_ID],
			[PROBE_TARGET_ID],
		]);
	});

	it('reports a reference that no longer resolves after the swap', async () => {
		const { lake, store } = createFakeStore([]);
		// oxlint-disable-next-line typescript/require-await -- stands in for the async store method
		store.swapType.mockImplementationOnce(async (legacyId) => {
			lake.delete(legacyId);
		});

		await expect(runTypeSwapProbe(store)).resolves.toBe(
			`Der Verweis der Person zeigt nach dem Typwechsel ins Leere (${PROBE_TARGET_ID}).`,
		);
	});

	// An aborted probe may have left its documents behind.
	it('clears what an earlier probe left before it starts', async () => {
		const { store } = createFakeStore([{ _id: PROBE_TARGET_ID, _type: 'group' }]);

		await expect(runTypeSwapProbe(store)).resolves.toBe('ok');

		const firstCreate = Math.min(...store.createOrReplace.mock.invocationCallOrder);
		const [firstDelete] = store.deleteDocument.mock.invocationCallOrder;
		expect(firstDelete).toBeLessThan(firstCreate);
	});
});
