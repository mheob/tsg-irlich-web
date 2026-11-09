import type { ValidationContext } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import faq, { prepareFaqPreview, validateFaqIsAssigned } from './faq';

interface FaqField {
	readonly name: string;
	readonly of?: readonly Record<string, unknown>[];
	readonly type: string;
}

function getField(name: string): FaqField {
	const field = (faq as unknown as { fields: readonly FaqField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the FAQ to declare a "${name}" field.`);
	}
	return field;
}

/**
 * Builds a validation context whose client answers the assignment query with a fixed result.
 *
 * @param isAssigned - What the query answers.
 * @returns The context and the spies on its client.
 */
function contextAnswering(isAssigned: boolean): {
	context: ValidationContext;
	fetch: ReturnType<typeof vi.fn>;
	getClient: ReturnType<typeof vi.fn>;
	withConfig: ReturnType<typeof vi.fn>;
} {
	const fetch = vi.fn().mockResolvedValue(isAssigned);
	const withConfig = vi.fn(() => ({ fetch }));
	const getClient = vi.fn(() => ({ withConfig }));
	const context = { getClient } as unknown as ValidationContext;
	return { context, fetch, getClient, withConfig };
}

const UNASSIGNED_WARNING =
	'Diese Frage steht in keiner Abteilung und erscheint deshalb nirgends auf der Website. Zuordnen lässt sie sich in der Abteilung, Tab „Inhalt“.';

describe('faq document', () => {
	it('names its type faq and titles it "FAQ"', () => {
		expect(faq).toMatchObject({ name: 'faq', title: 'FAQ' });
	});

	// The department decides where a question appears and in which order (WEB-431).
	it('declares only question and answer', () => {
		expect(faq.fields.map((field) => field.name)).toStrictEqual(['question', 'answer']);
	});

	it('sorts the list by question', () => {
		expect(faq.orderings.map((ordering) => ordering.by)).toStrictEqual([
			[{ direction: 'asc', field: 'question' }],
			[{ direction: 'desc', field: 'question' }],
		]);
	});

	it('shows where the question is used, without linking or creating from the FAQ', () => {
		const members = faq.renderMembers([]);

		expect(members.at(-1)).toMatchObject({ key: 'usedIn', kind: 'decoration' });
	});

	it('allows paragraphs, lists, bold, italic and both link types in the answer', () => {
		expect(getField('answer').of?.[0]).toMatchObject({
			lists: [{ value: 'bullet' }, { value: 'number' }],
			marks: {
				annotations: [{ name: 'internalLink' }, { name: 'externalLink' }],
				decorators: [{ value: 'strong' }, { value: 'em' }],
			},
			styles: [{ value: 'normal' }],
			type: 'block',
		});
	});
});

describe('faq preview', () => {
	it('selects the question and the answer', () => {
		expect(faq.preview.select).toStrictEqual({ answer: 'answer', title: 'question' });
	});

	it('shows the start of the answer below the question', () => {
		expect(
			prepareFaqPreview({
				answer: [
					{ children: [{ text: 'Der Beitrag ' }, { text: 'kostet 8 €.' }] },
					{ children: [{ text: 'Zweiter Absatz' }] },
				],
				title: 'Was kostet es?',
			}),
		).toStrictEqual({ subtitle: 'Der Beitrag kostet 8 €.', title: 'Was kostet es?' });
	});

	it('leaves the subtitle out without an answer', () => {
		expect(prepareFaqPreview({ title: 'Was kostet es?' })).toStrictEqual({
			subtitle: undefined,
			title: 'Was kostet es?',
		});
	});

	it('leaves the subtitle out when the first block holds no text', () => {
		expect(
			prepareFaqPreview({ answer: [{ children: [{ text: '  ' }] }] }).subtitle,
		).toBeUndefined();
	});
});

describe('faq assignment warning', () => {
	it('warns while no department lists the question', async () => {
		const { context } = contextAnswering(false);

		await expect(validateFaqIsAssigned({ _id: 'drafts.faq-a' }, context)).resolves.toBe(
			UNASSIGNED_WARNING,
		);
	});

	// A department draft that lists the question is an assignment too: only the raw perspective
	// returns drafts and release versions next to the published documents.
	it('counts drafts and versions as an assignment', async () => {
		const { context, fetch, getClient, withConfig } = contextAnswering(true);

		await expect(validateFaqIsAssigned({ _id: 'drafts.faq-a' }, context)).resolves.toBe(true);
		expect(getClient).toHaveBeenCalledWith({ apiVersion: '2026-10-01' });
		expect(withConfig).toHaveBeenCalledWith({ perspective: 'raw' });
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('$id in faqs[]._ref'), {
			id: 'faq-a',
		});
	});

	it('checks nothing without a document', async () => {
		const { context, fetch } = contextAnswering(true);

		await expect(validateFaqIsAssigned(undefined, context)).resolves.toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});
});
