import { describe, expect, it } from 'vite-plus/test';

import { isCompleteFaq } from '@/utils/faq';

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
});
