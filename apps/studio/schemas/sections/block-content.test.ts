import { describe, expect, it } from 'vitest';

import blockContent from './block-content';

interface FakeSpan {
	readonly _type: string;
	readonly text?: string;
}

interface FakeBlock {
	readonly _type: string;
	readonly children?: readonly FakeSpan[];
}

function prepareBlockContent(blocks: readonly FakeBlock[]): { title: string } {
	return (
		blockContent.preview.prepare as unknown as (value: { blocks: readonly FakeBlock[] }) => {
			title: string;
		}
	)({ blocks });
}

function span(text: string): FakeSpan {
	return { _type: 'span', text };
}

function block(children: readonly FakeSpan[]): FakeBlock {
	return { _type: 'block', children };
}

describe('block content preview', () => {
	it('joins every span of the first text block into the title', () => {
		const result = prepareBlockContent([block([span('Hello '), span('World')])]);

		expect(result).toStrictEqual({ title: 'Text: Hello World' });
	});

	it('only reads the first block of type "block", ignoring the rest', () => {
		const result = prepareBlockContent([block([span('First')]), block([span('Second')])]);

		expect(result).toStrictEqual({ title: 'Text: First' });
	});

	it('skips a leading non-block entry and uses the first actual block', () => {
		const result = prepareBlockContent([{ _type: 'mainImage' }, block([span('Second')])]);

		expect(result).toStrictEqual({ title: 'Text: Second' });
	});

	it('skips non-span children such as inline annotations', () => {
		const result = prepareBlockContent([
			block([span('Hello '), { _type: 'internalLink' }, span('World')]),
		]);

		expect(result).toStrictEqual({ title: 'Text: Hello World' });
	});

	it('falls back to "No title" when no block of type "block" is present', () => {
		const result = prepareBlockContent([{ _type: 'mainImage' }]);

		expect(result).toStrictEqual({ title: 'No title' });
	});

	it('falls back to "No title" for an empty blocks array', () => {
		const result = prepareBlockContent([]);

		expect(result).toStrictEqual({ title: 'No title' });
	});
});
