import { evaluate, parse } from 'groq-js';
import { describe, expect, it } from 'vite-plus/test';

import { departmentPageQuery, departmentRedirectQuery } from './departments';

describe('department redirect query', () => {
	// Two departments may list the same former slug, for instance when one was handed back and
	// forth. The pick has to be the same on every request, so the tie is broken by the id.
	it('picks the most recently updated department and breaks a tie by id', () => {
		expect(departmentRedirectQuery).toMatch(/\| order\(_updatedAt desc, _id asc\)\[0\]/u);
	});

	it('answers with the current slug of the department', () => {
		expect(departmentRedirectQuery).toContain('[0].slug.current');
	});
});

/**
 * Builds a department of the test dataset.
 *
 * @param department - The department.
 * @param department.faqIds - The questions it lists, in order.
 * @param department.id - Its id.
 * @param department.slug - Its slug.
 * @param department.sortOrder - Its position under /angebot.
 * @returns The department document.
 */
function department({
	faqIds,
	id,
	slug,
	sortOrder,
}: {
	faqIds: readonly string[];
	id: string;
	slug: string;
	sortOrder: number;
}): Record<string, unknown> {
	return {
		_id: id,
		_type: 'department',
		faqs: faqIds.map((faqId) => ({ _key: faqId, _ref: faqId, _type: 'reference' })),
		slug: { _type: 'slug', current: slug },
		sortOrder,
		title: id,
	};
}

/**
 * Builds a question of the test dataset, all with the same one-paragraph answer.
 *
 * @param id - The id of the question.
 * @param question - The question.
 * @returns The FAQ document.
 */
function faq(id: string, question: string): Record<string, unknown> {
	return {
		_id: id,
		_type: 'faq',
		answer: [
			{
				_key: 'block',
				_type: 'block',
				children: [{ _key: 'span', _type: 'span', marks: [], text: 'Dienstags und donnerstags.' }],
				markDefs: [],
				style: 'normal',
			},
		],
		question,
	};
}

/**
 * Runs the department page query against a dataset, the way the Content Lake would.
 *
 * @param slug - The slug of the department.
 * @param dataset - The documents to query.
 * @returns What the query returns for that department.
 */
async function runDepartmentPage(
	slug: string,
	dataset: readonly Record<string, unknown>[],
): Promise<{ faqs: { _id: string; answerText?: string; isMarkedUp?: boolean }[] }> {
	const params = { slug };
	const value = await evaluate(parse(departmentPageQuery, { params }), { dataset, params });
	return (await value.get()) as {
		faqs: { _id: string; answerText?: string; isMarkedUp?: boolean }[];
	};
}

describe('department page query', () => {
	/**
	 * Two departments that share `faq-shared`. Department b lists its questions in an order of its
	 * own and points at `faq-gone`, which does not exist (anymore, or not yet in this perspective).
	 */
	const DATASET = [
		department({ faqIds: ['faq-shared'], id: 'department-a', slug: 'a', sortOrder: 10 }),
		department({
			faqIds: ['faq-b2', 'faq-shared', 'faq-gone', 'faq-b1'],
			id: 'department-b',
			slug: 'b',
			sortOrder: 20,
		}),
		faq('faq-shared', 'Was kostet die Mitgliedschaft?'),
		faq('faq-b1', 'Ab welchem Alter?'),
		faq('faq-b2', 'Wann wird trainiert?'),
	];

	it('keeps the order of the department', async () => {
		const page = await runDepartmentPage('b', DATASET);

		expect(page.faqs.map((entry) => entry._id)).toStrictEqual(['faq-b2', 'faq-shared', 'faq-b1']);
	});

	// A reference to a question that is unpublished or deleted resolves to nothing; the page must not
	// render an empty accordion item for it.
	it('drops a FAQ that does not resolve', async () => {
		const page = await runDepartmentPage('b', DATASET);

		expect(page.faqs).not.toContainEqual(null);
		expect(page.faqs.map((entry) => entry._id)).not.toContain('faq-gone');
	});

	// Google wants a question that appears on several pages marked up once per site: on the
	// department that comes first under /angebot.
	it('marks up a shared FAQ on the first department only', async () => {
		const pageA = await runDepartmentPage('a', DATASET);
		const pageB = await runDepartmentPage('b', DATASET);

		expect(pageA.faqs.find((entry) => entry._id === 'faq-shared')?.isMarkedUp).toBe(true);
		expect(pageB.faqs.find((entry) => entry._id === 'faq-shared')?.isMarkedUp).toBe(false);
		expect(pageB.faqs.find((entry) => entry._id === 'faq-b1')?.isMarkedUp).toBe(true);
	});

	it('breaks a sort order tie by id', async () => {
		const tied = [
			department({ faqIds: ['faq-shared'], id: 'department-b', slug: 'b', sortOrder: 10 }),
			department({ faqIds: ['faq-shared'], id: 'department-a', slug: 'a', sortOrder: 10 }),
			faq('faq-shared', 'Was kostet die Mitgliedschaft?'),
		];

		const pageA = await runDepartmentPage('a', tied);
		const pageB = await runDepartmentPage('b', tied);

		expect(pageA.faqs[0]?.isMarkedUp).toBe(true);
		expect(pageB.faqs[0]?.isMarkedUp).toBe(false);
	});

	it('reads the answer as plain text', async () => {
		const page = await runDepartmentPage('b', DATASET);

		expect(page.faqs[0]?.answerText).toBe('Dienstags und donnerstags.');
	});

	// An answer that links to a department references it too, so `references()` would count it as
	// a department that lists the question. Only `faqs` decides.
	it('finds the departments of a question by their faqs field, not by any reference', () => {
		expect(departmentPageQuery).toContain("_type == 'department' && ^._id in faqs[]._ref");
		expect(departmentPageQuery).not.toContain('references(');
	});
});
