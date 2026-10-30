import { describe, expect, it } from 'vite-plus/test';

import { SNIPPET_LENGTH } from './constants';
import { getSnippet, splitHighlights } from './highlight';

const ELLIPSIS = '…';

// Builds distinct seven-letter words (`wort000`, `wort001`, …), so a cut through a word leaves a
// token that is none of the original ones.
function buildTokens(count: number): string[] {
	return Array.from({ length: count }, (_, index) => `wort${String(index).padStart(3, '0')}`);
}

// The snippet of a text that has one, as a string, so a test needs no conditional to read it.
function cut(text: string, words: string[], length?: number): string {
	return getSnippet(text, words, length) ?? '';
}

// The words of a snippet without the ellipses at its ends.
function getInnerTokens(snippet: string): string[] {
	return snippet.replaceAll(ELLIPSIS, '').split(' ');
}

describe('a snippet', () => {
	// 76 tokens of up to 7 letters plus a space: 606 characters, the match in the middle.
	const tokens = buildTokens(76);
	tokens[37] = 'Tanzen';
	const middleText = tokens.join(' ');

	it('is undefined for an empty text', () => {
		expect(getSnippet('', ['tanz'])).toBeUndefined();
	});

	it('is undefined for a text of whitespace only', () => {
		expect(getSnippet(' \n\t ', ['tanz'])).toBeUndefined();
	});

	it('is the whole text when it fits, whether it matches or not', () => {
		expect(getSnippet('Tanzen bei den Diamonds', ['tanz'])).toBe('Tanzen bei den Diamonds');
		expect(getSnippet('Tanzen bei den Diamonds', ['fussball'])).toBe('Tanzen bei den Diamonds');
	});

	it('is as long as the length allows and no longer', () => {
		const text = 'a'.repeat(SNIPPET_LENGTH);

		expect(getSnippet(text, ['b'])).toBe(text);
	});

	it('collapses the whitespace of the text, newlines included', () => {
		expect(getSnippet('  Tanzen\n\nbei   den\tDiamonds ', ['tanz'])).toBe(
			'Tanzen bei den Diamonds',
		);
	});

	it('keeps a match in the middle of a long text within the length', () => {
		const snippet = cut(middleText, ['tanz']);

		expect(middleText.length).toBeGreaterThanOrEqual(600);
		expect(snippet).toContain('Tanzen');
		expect(snippet.length).toBeLessThanOrEqual(SNIPPET_LENGTH + 2);
	});

	it('puts an ellipsis on both sides of a match in the middle', () => {
		const snippet = cut(middleText, ['tanz']);

		expect(snippet.startsWith(ELLIPSIS)).toBe(true);
		expect(snippet.endsWith(ELLIPSIS)).toBe(true);
	});

	it('cuts at word boundaries', () => {
		for (const token of getInnerTokens(cut(middleText, ['tanz']))) {
			expect(tokens).toContain(token);
		}
	});

	it('keeps a match at the start without a leading ellipsis', () => {
		const startTokens = buildTokens(76);
		startTokens[1] = 'Tanzen';
		const snippet = cut(startTokens.join(' '), ['tanz']);

		expect(snippet.startsWith('wort000 Tanzen')).toBe(true);
		expect(snippet.endsWith(ELLIPSIS)).toBe(true);
		expect(snippet.length).toBeLessThanOrEqual(SNIPPET_LENGTH + 1);
	});

	it('keeps a match at the end without a trailing ellipsis', () => {
		const endTokens = buildTokens(76);
		endTokens[74] = 'Tanzen';
		const snippet = cut(endTokens.join(' '), ['tanz']);

		expect(snippet.startsWith(ELLIPSIS)).toBe(true);
		expect(snippet.endsWith('Tanzen wort075')).toBe(true);
		expect(snippet.length).toBeLessThanOrEqual(SNIPPET_LENGTH + 1);
	});

	it('is the start of the text when nothing matches', () => {
		const text = buildTokens(76).join(' ');
		const snippet = cut(text, ['tanz']);

		expect(snippet.startsWith('wort000 wort001')).toBe(true);
		expect(snippet.endsWith(ELLIPSIS)).toBe(true);
		expect(text.startsWith(snippet.replace(ELLIPSIS, ''))).toBe(true);
	});

	it('fills the window up to the last word that fits when nothing matches', () => {
		const inner = cut(buildTokens(76).join(' '), ['tanz']).replace(ELLIPSIS, '');

		expect(inner.length).toBeLessThanOrEqual(SNIPPET_LENGTH);
		expect(inner.length).toBeGreaterThan(SNIPPET_LENGTH - 8);
		expect(getInnerTokens(inner).every((token) => token.startsWith('wort'))).toBe(true);
	});

	it('is the start of the text when there are no words', () => {
		expect(cut(buildTokens(76).join(' '), []).startsWith('wort000 wort001')).toBe(true);
	});

	it('honours a custom length', () => {
		const snippet = cut(middleText, ['tanz'], 40);

		expect(snippet).toContain('Tanzen');
		expect(snippet.replaceAll(ELLIPSIS, '').length).toBeLessThanOrEqual(40);
	});

	it('finds a word that starts with a German letter, whatever its case', () => {
		const text = `${'lorem '.repeat(60)}Übung macht den Meister ${'ipsum '.repeat(60)}`;

		expect(cut(text, ['übung'])).toContain('Übung macht den Meister');
	});

	it('does not centre on a word that only ends in the term', () => {
		// "Distanz" ends in "tanz" but is no match, so the real match further on wins.
		const snippet = cut(`${'Distanz '.repeat(40)}Tanzen ${'wort '.repeat(40)}`, ['tanz']);

		expect(snippet).toContain('Tanzen');
		expect(snippet.startsWith(ELLIPSIS)).toBe(true);
	});

	it('keeps a match that sits in a word longer than the snippet', () => {
		// No space to cut at before the match, so the cut falls inside the long word, not into the match.
		const snippet = cut(`${'y'.repeat(300)}-Tanz ${'z'.repeat(300)}`, ['tanz']);

		expect(snippet).toContain('-Tanz');
		expect(snippet.length).toBeLessThanOrEqual(SNIPPET_LENGTH + 2);
	});

	it('cuts a first word that is longer than the snippet', () => {
		expect(cut(`Tanz${'x'.repeat(500)}`, ['tanz'])).toBe(
			`Tanz${'x'.repeat(SNIPPET_LENGTH - 4)}${ELLIPSIS}`,
		);
	});
});

describe('the highlight parts of a text', () => {
	it('mark a prefix at the start of a word, whatever its case', () => {
		expect(splitHighlights('Tanzen bei den Diamonds', ['tanz', 'diamonds'])).toStrictEqual([
			{ isMatch: true, text: 'Tanz' },
			{ isMatch: false, text: 'en bei den ' },
			{ isMatch: true, text: 'Diamonds' },
		]);
	});

	it('match an uppercase text and an uppercase word', () => {
		expect(splitHighlights('TANZEN', ['Tanz'])).toStrictEqual([
			{ isMatch: true, text: 'TANZ' },
			{ isMatch: false, text: 'EN' },
		]);
	});

	it('do not mark a word inside another word', () => {
		expect(splitHighlights('Distanz', ['tanz'])).toStrictEqual([
			{ isMatch: false, text: 'Distanz' },
		]);
	});

	it('treat German letters as word characters', () => {
		// `\b` would call "ä" a non-word character and mark "tanz" in "Bärtanz" and "ätanz".
		expect(splitHighlights('Bärtanz ätanz', ['tanz'])).toStrictEqual([
			{ isMatch: false, text: 'Bärtanz ätanz' },
		]);
		expect(splitHighlights('Fußball', ['ball'])).toStrictEqual([
			{ isMatch: false, text: 'Fußball' },
		]);
	});

	it('mark a word that starts with a German letter', () => {
		expect(splitHighlights('Die Übung und die Öffnung', ['übung', 'öffn'])).toStrictEqual([
			{ isMatch: false, text: 'Die ' },
			{ isMatch: true, text: 'Übung' },
			{ isMatch: false, text: ' und die ' },
			{ isMatch: true, text: 'Öffn' },
			{ isMatch: false, text: 'ung' },
		]);
	});

	it('mark a word after punctuation', () => {
		expect(splitHighlights('(Tanz) und E-Jugend', ['tanz', 'jugend'])).toStrictEqual([
			{ isMatch: false, text: '(' },
			{ isMatch: true, text: 'Tanz' },
			{ isMatch: false, text: ') und E-' },
			{ isMatch: true, text: 'Jugend' },
		]);
	});

	it('mark the longer of two words that share a start', () => {
		expect(splitHighlights('Tanzen', ['tanz', 'tanzen'])).toStrictEqual([
			{ isMatch: true, text: 'Tanzen' },
		]);
	});

	it('mark every occurrence', () => {
		expect(splitHighlights('Tanz tanz', ['tanz'])).toStrictEqual([
			{ isMatch: true, text: 'Tanz' },
			{ isMatch: false, text: ' ' },
			{ isMatch: true, text: 'tanz' },
		]);
	});

	it('take a word literally, not as a pattern', () => {
		expect(splitHighlights('1x Mannschaft', ['1.'])).toStrictEqual([
			{ isMatch: false, text: '1x Mannschaft' },
		]);
		expect(splitHighlights('1. Mannschaft', ['1.'])).toStrictEqual([
			{ isMatch: true, text: '1.' },
			{ isMatch: false, text: ' Mannschaft' },
		]);
		expect(splitHighlights('C++ Kurs', ['c++'])).toStrictEqual([
			{ isMatch: true, text: 'C++' },
			{ isMatch: false, text: ' Kurs' },
		]);
	});

	it('do not mark a number inside a longer number', () => {
		expect(splitHighlights('11. Mannschaft', ['1.'])).toStrictEqual([
			{ isMatch: false, text: '11. Mannschaft' },
		]);
	});

	it('are one plain part without words, or with empty ones', () => {
		expect(splitHighlights('Tanzen', [])).toStrictEqual([{ isMatch: false, text: 'Tanzen' }]);
		expect(splitHighlights('Tanzen', [''])).toStrictEqual([{ isMatch: false, text: 'Tanzen' }]);
	});

	it('are none for an empty text', () => {
		expect(splitHighlights('', ['tanz'])).toStrictEqual([]);
		expect(splitHighlights('', [])).toStrictEqual([]);
	});

	it('join to the original text', () => {
		const text = 'Tanzen, tanzen und nochmal Tanz – Distanz nicht';
		const parts = splitHighlights(text, ['tanz']);

		expect(parts.map((part) => part.text).join('')).toBe(text);
	});
});
