// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { BOARD_IDS } from './board';

describe('board ids', () => {
	it('names the four members of the board once each', () => {
		expect(BOARD_IDS).toHaveLength(4);
		expect(new Set(BOARD_IDS).size).toBe(4);
	});

	it('keeps the order the board is usually listed in, the chair first', () => {
		expect(BOARD_IDS[0]).toBe('2e62c3c7-6d23-4799-9701-a08256d0c1b2');
	});
});
