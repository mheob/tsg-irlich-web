import type { PreviewValue, SlugValidationContext } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import group, { isGroupSlugUniqueInDepartment } from './group';

interface GroupField {
	readonly hidden?: boolean | ((context: TrainingContext) => boolean);
	readonly name: string;
	readonly options?: { isUnique?: unknown };
	readonly to?: readonly { readonly type: string }[];
	readonly type: string;
	readonly validation?: (rule: FakeRule) => readonly [TrainingValidator];
}

interface GroupPreviewSelection {
	readonly sortOrder?: number;
	readonly title?: string;
}

interface FakeRule {
	custom: (fn: TrainingValidator) => TrainingValidator;
}

interface TrainingContext {
	readonly document?: { readonly title?: string };
}

type TrainingValidator = (value: unknown, context: TrainingContext) => true | string;

function getField(name: string): GroupField {
	const field = (group as unknown as { fields: readonly GroupField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the group to declare a "${name}" field.`);
	}
	return field;
}

function prepareGroupPreview(selection: GroupPreviewSelection): PreviewValue {
	return (group.preview.prepare as unknown as (value: GroupPreviewSelection) => PreviewValue)(
		selection,
	);
}

function getTrainingValidator(): TrainingValidator {
	const { validation } = getField('training');
	if (!validation) {
		throw new Error('Expected the training field to declare a validation function.');
	}
	const [validate] = validation({ custom: (fn) => fn });
	return validate;
}

function getTrainingHidden(): (context: TrainingContext) => boolean {
	const { hidden } = getField('training');
	if (typeof hidden !== 'function') {
		throw new TypeError('Expected the training field to hide itself through a function.');
	}
	return hidden;
}

interface ContextOptions {
	/** How many other groups of the department already use the slug. */
	readonly count?: number;
	readonly departmentId?: string;
	readonly documentId?: string;
}

// The slug validation context of a group document whose count query answers `count`.
function contextWith({ count = 0, departmentId, documentId = 'drafts.abc' }: ContextOptions): {
	context: SlugValidationContext;
	fetch: ReturnType<typeof vi.fn>;
	getClient: ReturnType<typeof vi.fn>;
	withConfig: ReturnType<typeof vi.fn>;
} {
	const fetch = vi.fn().mockResolvedValue(count === 0);
	const withConfig = vi.fn(() => ({ fetch }));
	const getClient = vi.fn(() => ({ withConfig }));
	const context = {
		document: {
			_id: documentId,
			department: departmentId ? { _ref: departmentId } : undefined,
		},
		getClient,
	} as unknown as SlugValidationContext;
	return { context, fetch, getClient, withConfig };
}

describe('group document', () => {
	it('names its type group and titles it "Gruppe"', () => {
		expect(group).toMatchObject({ name: 'group', title: 'Gruppe' });
	});

	it('starts with the department', () => {
		expect((group as unknown as { fields: { name: string }[] }).fields[0]?.name).toBe('department');
	});

	it('requires a department', () => {
		expect(getField('department')).toMatchObject({
			to: [{ type: 'department' }],
			type: 'reference',
		});
	});

	it('keeps the former sport group fields and drops the sport group switch', () => {
		const fieldNames = (group as unknown as { fields: { name: string }[] }).fields.map(
			(field) => field.name,
		);

		expect(fieldNames).toStrictEqual([
			'department',
			'title',
			'slug',
			'previousPaths',
			'email',
			'meta',
			'overviewTitle',
			'sortOrder',
			'description',
			'icon',
			'featuredImage',
			'images',
			'training',
			'newsCategory',
		]);
	});

	it('never hides the fields that used to be hidden for non-sport groups', () => {
		for (const name of ['icon', 'featuredImage', 'images', 'newsCategory']) {
			expect(getField(name).hidden).toBeUndefined();
		}
	});

	it('checks the slug against the groups of the same department', () => {
		expect(getField('slug').options?.isUnique).toBe(isGroupSlugUniqueInDepartment);
	});
});

describe('group preview', () => {
	it('assembles the subtitle from the sort order and passes the title through', () => {
		const result = prepareGroupPreview({ sortOrder: 3, title: 'Herren' });

		expect(result).toStrictEqual({ subtitle: 'Sortierreihenfolge: 3', title: 'Herren' });
	});

	// A group created before it got a sort order shows the literal word in the Studio list until an
	// editor saves it with one; pinned rather than fixed, since the field stays required.
	it('stringifies a missing sort order as the literal word "undefined"', () => {
		const result = prepareGroupPreview({ title: 'Herren' });

		expect(result).toStrictEqual({ subtitle: 'Sortierreihenfolge: undefined', title: 'Herren' });
	});

	it('passes a missing title through as undefined', () => {
		expect(prepareGroupPreview({ sortOrder: 1 }).title).toBeUndefined();
	});
});

describe('group news category', () => {
	// The web app dereferences this field to a `news.category` document, so any other target type
	// would leave the group page without its news section.
	it('references exactly one news category', () => {
		expect(getField('newsCategory')).toMatchObject({
			to: [{ type: 'news.category' }],
			type: 'reference',
		});
	});
});

describe('group slug uniqueness', () => {
	it('accepts a slug no other group of the department uses', async () => {
		const { context } = contextWith({ count: 0, departmentId: 'department-fussball' });

		await expect(isGroupSlugUniqueInDepartment('herren', context)).resolves.toBe(true);
	});

	it('rejects a slug another group of the same department uses', async () => {
		const { context } = contextWith({ count: 1, departmentId: 'department-fussball' });

		await expect(isGroupSlugUniqueInDepartment('herren', context)).resolves.toBe(false);
	});

	// A draft or a release version of the document itself is not a second group, but a draft of
	// another group with the same slug is, so the query matches by published id and sees every
	// version, which only the raw perspective returns.
	it('asks for every version of the documents and excludes the versions of this one', async () => {
		const { context, fetch, getClient, withConfig } = contextWith({
			departmentId: 'department-fussball',
			documentId: 'drafts.abc',
		});

		await isGroupSlugUniqueInDepartment('herren', context);

		expect(getClient).toHaveBeenCalledWith({ apiVersion: '2026-10-01' });
		expect(withConfig).toHaveBeenCalledWith({ perspective: 'raw' });
		expect(fetch).toHaveBeenCalledExactlyOnceWith(
			'count(*[_type == "group" && slug.current == $slug && department._ref == $departmentId && !sanity::versionOf($publishedId)]) == 0',
			{ departmentId: 'department-fussball', publishedId: 'abc', slug: 'herren' },
		);
	});

	it('derives the published id from a published document', async () => {
		const { context, fetch } = contextWith({
			departmentId: 'department-fussball',
			documentId: 'abc',
		});

		await isGroupSlugUniqueInDepartment('herren', context);

		expect(fetch).toHaveBeenCalledWith(expect.any(String), {
			departmentId: 'department-fussball',
			publishedId: 'abc',
			slug: 'herren',
		});
	});

	it('derives the published id from the version of a release', async () => {
		const { context, fetch } = contextWith({
			departmentId: 'department-fussball',
			documentId: 'versions.rSommer.abc',
		});

		await isGroupSlugUniqueInDepartment('herren', context);

		expect(fetch).toHaveBeenCalledWith(expect.any(String), {
			departmentId: 'department-fussball',
			publishedId: 'abc',
			slug: 'herren',
		});
	});

	// The required department error already tells the editor what is missing.
	it('accepts any slug while no department is chosen', async () => {
		const { context, fetch } = contextWith({ departmentId: undefined });

		await expect(isGroupSlugUniqueInDepartment('herren', context)).resolves.toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('group training time requirement', () => {
	it('requires training times for a group whose title is not "Schiedsrichter"', () => {
		expect(getTrainingValidator()(undefined, { document: { title: 'Herren' } })).toBe(
			'Trainingszeiten und -orte sind erforderlich',
		);
	});

	it('passes once training times are set', () => {
		expect(
			getTrainingValidator()({ trainingDescription: 'x' }, { document: { title: 'Herren' } }),
		).toBe(true);
	});

	it('exempts a group titled "Schiedsrichter", case-insensitively, even without training times', () => {
		expect(getTrainingValidator()(undefined, { document: { title: 'SCHIEDSRICHTER' } })).toBe(true);
	});

	it('requires training times when the document has no title yet', () => {
		expect(getTrainingValidator()(undefined, { document: {} })).toBe(
			'Trainingszeiten und -orte sind erforderlich',
		);
	});

	it('hides the training times of a group titled "Schiedsrichter"', () => {
		const hidden = getTrainingHidden();

		expect(hidden({ document: { title: 'Schiedsrichter' } })).toBe(true);
		expect(hidden({ document: { title: 'Herren' } })).toBe(false);
	});
});
