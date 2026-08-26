import { afterEach, describe, expect, it, vi } from 'vitest';

import { shuffleArray } from './array';

describe('shuffling an array', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a new array', () => {
		const input = [1, 2, 3];
		const result = shuffleArray(input);
		expect(result).not.toBe(input);
		expect(result).toHaveLength(3);
	});

	it('leaves the input untouched', () => {
		// Stubbed so a bug that mutates the input in place would show a deterministic,
		// non-identity permutation here rather than passing by luck. A five-element input also
		// means a single self-swap cannot mask the mutation the way it could with three.
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const input = [1, 2, 3, 4, 5];
		shuffleArray(input);
		expect(input).toStrictEqual([1, 2, 3, 4, 5]);
	});

	it('keeps every member', () => {
		expect([...shuffleArray([1, 2, 3, 4])].toSorted((a, b) => a - b)).toStrictEqual([1, 2, 3, 4]);
	});

	it('handles an empty array', () => {
		expect(shuffleArray([])).toStrictEqual([]);
	});

	it('handles a single element', () => {
		expect(shuffleArray(['a'])).toStrictEqual(['a']);
	});

	it('is deterministic when Math.random is fixed at 0', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		// The loop runs i = 2, then i = 1. With random() === 0, index = floor(0 * (i + 1)) = 0
		// every time, so each step swaps position i with position 0:
		//   i=2: swap(2, 0) on [1, 2, 3] -> [3, 2, 1]
		//   i=1: swap(1, 0) on [3, 2, 1] -> [2, 3, 1]
		expect(shuffleArray([1, 2, 3])).toStrictEqual([2, 3, 1]);
	});

	it('is deterministic when Math.random is fixed just under 1', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.999999);
		// index = floor(0.999999 * (i + 1)), which equals i itself for both loop steps
		// (floor(0.999999 * 3) = 2, floor(0.999999 * 2) = 1), so every swap is a self-swap
		// and the array comes back unchanged. A version that multiplied by `i` instead of
		// `i + 1` would produce [3, 1, 2] here instead.
		expect(shuffleArray([1, 2, 3])).toStrictEqual([1, 2, 3]);
	});
});
