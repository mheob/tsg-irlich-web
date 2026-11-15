import { describe, expect, it } from 'vite-plus/test';

import { getSkippedHeadings } from './heading-order';

function block(key: string, style: string): Record<string, unknown> {
	return { _key: key, _type: 'block', children: [], style };
}

function section(key: string, ...text: unknown[]): Record<string, unknown> {
	return { _key: key, _type: 'blockContent', text };
}

describe('skipped headings', () => {
	it('lists every H3 of a body without an H2', () => {
		const body = [
			section('a', block('a1', 'normal'), block('a2', 'h3'), block('a3', 'normal')),
			{ _key: 'image', _type: 'mainImage' },
			section('b', block('b1', 'h3')),
		];

		expect(getSkippedHeadings(body)).toStrictEqual([
			{ blockKey: 'a2', sectionKey: 'a', style: 'h3' },
			{ blockKey: 'b1', sectionKey: 'b', style: 'h3' },
		]);
	});

	it('lists only the H3 before the first H2', () => {
		const body = [
			section('a', block('a1', 'h3'), block('a2', 'h3')),
			section('b', block('b1', 'h2'), block('b2', 'h3'), block('b3', 'h2')),
		];

		expect(getSkippedHeadings(body)).toStrictEqual([
			{ blockKey: 'a1', sectionKey: 'a', style: 'h3' },
			{ blockKey: 'a2', sectionKey: 'a', style: 'h3' },
		]);
	});

	it('finds nothing when the body opens with an H2', () => {
		const body = [section('a', block('a1', 'h2'), block('a2', 'h3'), block('a3', 'h3'))];

		expect(getSkippedHeadings(body)).toStrictEqual([]);
	});

	it('finds nothing in a body without headings', () => {
		const body = [section('a', block('a1', 'normal'), block('a2', 'blockquote'))];

		expect(getSkippedHeadings(body)).toStrictEqual([]);
	});

	// The article page renders only the images of a grid, so its text holds no heading of the page.
	it('ignores the text inside a grid', () => {
		const body = [
			{
				_key: 'grid',
				_type: 'grid',
				items: [section('g', block('g1', 'h3'))],
			},
			section('a', block('a1', 'h2')),
		];

		expect(getSkippedHeadings(body)).toStrictEqual([]);
	});

	it('skips what it cannot address or read', () => {
		const body = [
			{ _type: 'blockContent', text: [block('x1', 'h3')] },
			section('a', { _type: 'block', style: 'h3' }, { _key: 'a2', _type: 'image' }, 'text'),
			section('b', block('b1', 'h3')),
			{ _key: 'c', _type: 'blockContent' },
			null,
		];

		expect(getSkippedHeadings(body)).toStrictEqual([
			{ blockKey: 'b1', sectionKey: 'b', style: 'h3' },
		]);
	});

	it('finds nothing in a missing body', () => {
		expect(getSkippedHeadings(null)).toStrictEqual([]);
		expect(getSkippedHeadings({})).toStrictEqual([]);
	});
});
