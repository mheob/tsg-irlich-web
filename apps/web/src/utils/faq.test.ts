import { describe, expect, it } from 'vite-plus/test';

import { isCompleteFaq } from '@/utils/faq';

import { encodeLikeDraftMode } from '../../test-utils/stega';

describe('complete faq', () => {
	it('accepts a question with an answer', () => {
		expect(isCompleteFaq({ answerText: 'Ja.', question: 'Gibt es ein Probetraining?' })).toBe(true);
	});

	it.each([
		['is missing', undefined],
		['is null', null],
		['is blank', '  '],
	])('rejects a question that %s', (_name, question) => {
		expect(isCompleteFaq({ answerText: 'Ja.', question })).toBe(false);
	});

	it.each([
		['is missing', undefined],
		['is null', null],
		['is empty', ''],
		['is blank', '\n '],
	])('rejects an answer text that %s', (_name, answerText) => {
		expect(isCompleteFaq({ answerText, question: 'Gibt es ein Probetraining?' })).toBe(false);
	});

	// In draft mode `sanityFetch` appends invisible characters to every string, a blank one too.
	it('rejects a blank question or answer that carries the draft mode encoding', () => {
		const answerText = 'Ja.';
		const question = 'Gibt es ein Probetraining?';

		expect(isCompleteFaq({ answerText, question: encodeLikeDraftMode('  ') })).toBe(false);
		expect(isCompleteFaq({ answerText: encodeLikeDraftMode(''), question })).toBe(false);
		expect(
			isCompleteFaq({
				answerText: encodeLikeDraftMode(answerText),
				question: encodeLikeDraftMode(question),
			}),
		).toBe(true);
	});
});
