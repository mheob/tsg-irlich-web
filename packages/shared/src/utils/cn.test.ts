import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('merging class names', () => {
	it('joins plain strings', () => {
		expect(cn('flex', 'items-center')).toBe('flex items-center');
	});

	it('includes only the truthy keys of a conditional object', () => {
		expect(cn({ active: false, disabled: true, selected: true })).toBe('disabled selected');
	});

	it('drops undefined, null and false entries', () => {
		expect(cn('flex', undefined, null, false, 'items-center')).toBe('flex items-center');
	});

	it('flattens nested arrays', () => {
		expect(cn(['flex', ['items-center', ['justify-between']]])).toBe(
			'flex items-center justify-between',
		);
	});

	it('lets a later conflicting Tailwind class win', () => {
		expect(cn('p-2', 'p-4')).toBe('p-4');
	});

	it('keeps both classes when they do not conflict', () => {
		expect(cn('p-4', 'text-white')).toBe('p-4 text-white');
	});

	it('returns an empty string for no arguments', () => {
		expect(cn()).toBe('');
	});
});
