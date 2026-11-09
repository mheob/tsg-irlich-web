import type { MigrationContext, SanityDocument } from 'sanity/migrate';
import { describe, expect, it, vi } from 'vite-plus/test';

import migration, { buildDepartmentFaqs, type FaqVersion, isSameFaqList } from './index';

type DocumentMigration = (document: SanityDocument, context: MigrationContext) => Promise<unknown>;

/**
 * FAQ as they stand before the migration. `faq-shared` is published for both departments, but its
 * draft only keeps department b. `faq-new` exists only as a draft. `faq-z` is published only.
 */
const FAQS: FaqVersion[] = [
	{
		_id: 'faq-shared',
		departments: [{ _ref: 'department-a' }, { _ref: 'department-b' }],
		question: 'Beitrag',
		sortOrder: 900,
	},
	{
		_id: 'drafts.faq-shared',
		departments: [{ _ref: 'department-b' }],
		question: 'Beitrag',
		sortOrder: 900,
	},
	{
		_id: 'drafts.faq-new',
		departments: [{ _ref: 'department-a' }],
		question: 'Alter',
		sortOrder: 110,
	},
	{ _id: 'faq-z', departments: [{ _ref: 'department-a' }], question: 'Zeiten', sortOrder: 110 },
	{
		_id: 'versions.r1.faq-x',
		departments: [{ _ref: 'department-a' }],
		question: 'X',
		sortOrder: 1,
	},
];

/**
 * Builds a migration context whose raw client answers the FAQ query with `faqs` and the draft check
 * with whether the asked id is among `existingIds`.
 *
 * @param faqs - The FAQ the client returns.
 * @param existingIds - The ids the draft check finds.
 * @returns The context and the spies on its client.
 */
function contextWith(
	faqs: readonly FaqVersion[],
	existingIds: readonly string[] = [],
): {
	context: MigrationContext;
	fetch: ReturnType<typeof vi.fn>;
	withConfig: ReturnType<typeof vi.fn>;
} {
	// The migration awaits every answer, so a plain value stands in for the resolved promise.
	const fetch = vi.fn((query: string, params?: { id?: string }) =>
		query.includes('count(') ? existingIds.includes(params?.id ?? '') : faqs,
	);
	const withConfig = vi.fn(() => ({ fetch }));
	const context = { client: { withConfig }, dryRun: true } as unknown as MigrationContext;
	return { context, fetch, withConfig };
}

/** The fields of the department besides the system fields. */
const DEPARTMENT_FIELDS: Record<string, unknown> = { title: 'Abteilung A' };

function department(id: string, fields: Record<string, unknown> = {}): SanityDocument {
	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return {
		_createdAt: '2026-01-01T00:00:00Z',
		_id: id,
		_rev: 'rev',
		_type: 'department',
		_updatedAt: '2026-01-02T00:00:00Z',
		...DEPARTMENT_FIELDS,
		...fields,
	};
}

async function migrate(document: SanityDocument, context: MigrationContext): Promise<unknown> {
	const { document: migrateDocument } = migration.migrate as { document: DocumentMigration };
	return migrateDocument(document, context);
}

describe('department faqs migration', () => {
	describe('the list of a department', () => {
		// The live website must not change through the migration, even where a draft of a question
		// has moved on.
		it('keeps the published department to published FAQs', () => {
			expect(
				buildDepartmentFaqs({ departmentId: 'department-a', faqs: FAQS, forDraft: false }),
			).toStrictEqual([
				{ _key: 'faq-z', _ref: 'faq-z', _type: 'reference' },
				{ _key: 'faq-shared', _ref: 'faq-shared', _type: 'reference' },
			]);
		});

		// A reference to a question that only exists as a draft is weak until the department is
		// published, the way the studio writes it itself.
		it('builds the draft from the newest version of every FAQ', () => {
			expect(
				buildDepartmentFaqs({ departmentId: 'department-a', faqs: FAQS, forDraft: true }),
			).toStrictEqual([
				{
					_key: 'faq-new',
					_ref: 'faq-new',
					_strengthenOnPublish: { type: 'faq' },
					_type: 'reference',
					_weak: true,
				},
				{ _key: 'faq-z', _ref: 'faq-z', _type: 'reference' },
			]);
		});

		it('orders by sort order, then by question', () => {
			const refs = buildDepartmentFaqs({
				departmentId: 'department-b',
				faqs: [
					{ _id: 'faq-3', departments: [{ _ref: 'department-b' }], question: 'B', sortOrder: 20 },
					{ _id: 'faq-4', departments: [{ _ref: 'department-b' }], question: 'A' },
					{ _id: 'faq-2', departments: [{ _ref: 'department-b' }], question: 'B', sortOrder: 10 },
					{ _id: 'faq-1', departments: [{ _ref: 'department-b' }], question: 'A', sortOrder: 10 },
				],
				forDraft: false,
			});

			expect(refs.map((ref) => ref._ref)).toStrictEqual(['faq-1', 'faq-2', 'faq-3', 'faq-4']);
		});

		it('ignores release versions', () => {
			const draftRefs = buildDepartmentFaqs({
				departmentId: 'department-a',
				faqs: FAQS,
				forDraft: true,
			});

			expect(draftRefs.map((ref) => ref._ref)).not.toContain('faq-x');
		});

		it('compares two lists by their references, their order and their strength', () => {
			const strong = { _key: 'faq-a', _ref: 'faq-a', _type: 'reference' } as const;
			const weak = { ...strong, _strengthenOnPublish: { type: 'faq' }, _weak: true } as const;
			const other = { _key: 'faq-b', _ref: 'faq-b', _type: 'reference' } as const;

			expect(isSameFaqList([strong, other], [strong, other])).toBe(true);
			expect(isSameFaqList([strong, other], [other, strong])).toBe(false);
			expect(isSameFaqList([strong], [weak])).toBe(false);
			expect(isSameFaqList([strong], [strong, other])).toBe(false);
		});
	});

	describe('the document migration', () => {
		it('reads the FAQ in the raw perspective, which holds the drafts', async () => {
			const { context, withConfig } = contextWith(FAQS, ['drafts.department-a']);

			await migrate(department('department-a'), context);

			expect(withConfig).toHaveBeenCalledWith({ perspective: 'raw' });
		});

		it('patches the draft with the newest version of every FAQ', async () => {
			const { context } = contextWith(FAQS);

			await expect(migrate(department('drafts.department-a'), context)).resolves.toStrictEqual([
				{
					id: 'drafts.department-a',
					patches: [
						{
							op: {
								type: 'setIfMissing',
								value: buildDepartmentFaqs({
									departmentId: 'department-a',
									faqs: FAQS,
									forDraft: true,
								}),
							},
							path: ['faqs'],
						},
					],
					type: 'patch',
				},
			]);
		});

		it('patches the published department and leaves its existing draft alone', async () => {
			const { context } = contextWith(FAQS, ['drafts.department-a']);

			const mutations = await migrate(department('department-a'), context);

			expect(mutations).toStrictEqual([
				expect.objectContaining({ id: 'department-a', type: 'patch' }),
			]);
		});

		// Without a draft the assignment of `faq-new` would get lost: the published department may only
		// hold published questions.
		it('creates the missing draft', async () => {
			const { context } = contextWith(FAQS);

			const mutations = await migrate(department('department-a'), context);

			expect(mutations).toContainEqual({
				document: {
					_id: 'drafts.department-a',
					_type: 'department',
					faqs: buildDepartmentFaqs({ departmentId: 'department-a', faqs: FAQS, forDraft: true }),
					title: 'Abteilung A',
				},
				type: 'createIfNotExists',
			});
		});

		it('creates no draft when both lists match', async () => {
			const published: FaqVersion[] = [
				{ _id: 'faq-z', departments: [{ _ref: 'department-a' }], question: 'Zeiten', sortOrder: 1 },
			];
			const { context, fetch } = contextWith(published);

			const mutations = await migrate(department('department-a'), context);

			expect(mutations).toStrictEqual([
				expect.objectContaining({ id: 'department-a', type: 'patch' }),
			]);
			expect(fetch).toHaveBeenCalledOnce();
		});

		it('writes nothing for a department no FAQ names', async () => {
			const { context } = contextWith(FAQS, ['drafts.department-c']);

			await expect(migrate(department('department-c'), context)).resolves.toStrictEqual([]);
		});

		// A second run finds the FAQ fields gone and must not empty a list editors already sorted.
		it('leaves a department that already has faqs alone', async () => {
			const { context, fetch } = contextWith(FAQS);

			await expect(
				migrate(department('drafts.department-a', { faqs: [] }), context),
			).resolves.toStrictEqual([]);
			expect(fetch).not.toHaveBeenCalled();
		});

		it('skips release versions of a department', async () => {
			const { context, fetch } = contextWith(FAQS);

			await expect(migrate(department('versions.r1.department-a'), context)).resolves.toStrictEqual(
				[],
			);
			expect(fetch).not.toHaveBeenCalled();
		});
	});
});
