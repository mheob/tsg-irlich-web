import type {
	DocumentActionComponent,
	DocumentActionDescription,
	DocumentActionProps,
	DuplicateActionProps,
	SanityDocumentLike,
} from 'sanity';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createDuplicateWithoutSlugHistoryAction } from './duplicate-without-slug-history';

const originalDescription: DocumentActionDescription = {
	disabled: false,
	label: 'Duplizieren',
	onHandle: vi.fn<() => void>(),
	title: '',
};

const duplicateAction = Object.assign(
	vi.fn<DocumentActionComponent>(() => originalDescription),
	{ action: 'duplicate', displayName: 'DuplicateAction' } as const,
);

const props = {
	draft: null,
	id: 'tanz',
	published: null,
	type: 'department',
} as unknown as DocumentActionProps;

/**
 * Clicks "Duplizieren" in the wrapped action and returns what the studio would create, which is the
 * source document run through the `mapDocument` the original action was handed, or the source
 * itself when it was handed none.
 *
 * @param source - The document that is duplicated.
 * @returns The copy the studio would create.
 */
function duplicate(source: SanityDocumentLike): SanityDocumentLike {
	createDuplicateWithoutSlugHistoryAction(duplicateAction)(props);
	const [handedProps] = duplicateAction.mock.lastCall ?? [];
	const { mapDocument } = handedProps as DuplicateActionProps;
	return mapDocument ? mapDocument({ ...source }) : source;
}

describe('duplicate action without slug history', () => {
	beforeEach(() => {
		duplicateAction.mockClear();
	});

	describe('what the original action decides', () => {
		it('keeps label, icon, tooltip and disabled state of the original', () => {
			expect(createDuplicateWithoutSlugHistoryAction(duplicateAction)(props)).toBe(
				originalDescription,
			);
		});

		it('hands the props of the studio on to the original action', () => {
			createDuplicateWithoutSlugHistoryAction(duplicateAction)(props);

			expect(duplicateAction).toHaveBeenCalledWith(expect.objectContaining(props));
		});

		it('offers nothing where the original offers nothing', () => {
			duplicateAction.mockReturnValueOnce(null);

			expect(createDuplicateWithoutSlugHistoryAction(duplicateAction)(props)).toBeNull();
		});

		it('stays the duplicate action, so filters and other plugins still find it', () => {
			const wrapped = createDuplicateWithoutSlugHistoryAction(duplicateAction);

			expect(wrapped.action).toBe('duplicate');
		});
	});

	describe('the copy of a department', () => {
		const department = {
			_id: 'drafts.tanz-kopie',
			_type: 'department',
			previousSlugs: ['tanzen', 'tanz-alt'],
			slug: { _type: 'slug', current: 'tanz' },
			sortOrder: 40,
			title: 'Tanz',
		};

		it('starts without the former slugs of the original', () => {
			expect(duplicate(department)).not.toHaveProperty('previousSlugs');
		});

		it('keeps every other field of the original', () => {
			expect(duplicate(department)).toStrictEqual({
				_id: 'drafts.tanz-kopie',
				_type: 'department',
				slug: { _type: 'slug', current: 'tanz' },
				sortOrder: 40,
				title: 'Tanz',
			});
		});
	});

	describe('the copy of a group', () => {
		const group = {
			_id: 'drafts.yoga-kopie',
			_type: 'group',
			department: { _ref: 'department-kurse', _type: 'reference' },
			previousPaths: ['fitness/yoga'],
			slug: { _type: 'slug', current: 'yoga' },
			title: 'Yoga',
		};

		it('starts without the former addresses of the original', () => {
			expect(duplicate(group)).not.toHaveProperty('previousPaths');
		});

		it('keeps its department, its slug and every other field', () => {
			expect(duplicate(group)).toStrictEqual({
				_id: 'drafts.yoga-kopie',
				_type: 'group',
				department: { _ref: 'department-kurse', _type: 'reference' },
				slug: { _type: 'slug', current: 'yoga' },
				title: 'Yoga',
			});
		});
	});

	it('copies a document without a history as it is', () => {
		const withoutHistory = { _id: 'drafts.neu', _type: 'group', title: 'Neu' };

		expect(duplicate(withoutHistory)).toStrictEqual(withoutHistory);
	});
});
