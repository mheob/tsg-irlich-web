import type {
	DocumentActionComponent,
	DocumentActionDescription,
	DocumentActionProps,
} from 'sanity';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPublishWithSlugHistoryAction } from './publish-with-slug-history';

const studio = vi.hoisted(() => ({
	execute: vi.fn(),
	fetch: vi.fn(),
	pushToast: vi.fn(),
}));

// The action only needs the patch operation and the client of the studio. Calling the component as a
// plain function is enough once those hooks are replaced, because it renders nothing itself.
vi.mock(import('sanity'), () => ({
	useClient: (() => ({ fetch: studio.fetch })) as never,
	useDocumentOperation: (() => ({ patch: { execute: studio.execute } })) as never,
}));

vi.mock(import('@sanity/ui/toast'), () => ({
	useToast: (() => ({ push: studio.pushToast })) as never,
}));

const calls: string[] = [];

const originalOnHandle = vi.fn(() => {
	calls.push('publish');
});

const originalDescription: DocumentActionDescription = {
	disabled: false,
	label: 'Veröffentlichen',
	onHandle: originalOnHandle,
	shortcut: 'Ctrl+Alt+P',
	title: 'Alle Änderungen veröffentlichen',
	tone: 'default',
};

const publishAction = Object.assign(
	vi.fn<DocumentActionComponent>(() => originalDescription),
	{ action: 'publish', displayName: 'PublishAction' } as const,
);

function createProps(documents: Partial<DocumentActionProps>): DocumentActionProps {
	return {
		draft: null,
		id: 'yoga',
		published: null,
		type: 'group',
		...documents,
	} as DocumentActionProps;
}

/**
 * Clicks the button of the wrapped action and waits until the click has been handled.
 *
 * @param action - The description the wrapped action returned.
 */
async function click(action: DocumentActionDescription | null): Promise<void> {
	// The studio ignores what `onHandle` returns, but the wrapped one returns the promise of its click.
	const onHandle = action?.onHandle as (() => Promise<void>) | undefined;
	await onHandle?.();
}

function wrap(props: DocumentActionProps): DocumentActionDescription | null {
	return createPublishWithSlugHistoryAction(publishAction)(props);
}

const departmentRows = [
	{ _id: 'kurse', slug: 'kurse' },
	{ _id: 'weitere-sportarten', slug: 'weitere-sportarten' },
];

const publishedGroup = { _id: 'yoga', department: { _ref: 'kurse' }, slug: { current: 'yoga' } };

describe('publish action with slug history', () => {
	beforeEach(() => {
		calls.length = 0;
		originalOnHandle.mockClear();
		publishAction.mockClear();
		studio.execute.mockReset().mockImplementation(() => {
			calls.push('patch');
		});
		studio.fetch.mockReset().mockResolvedValue(departmentRows);
		studio.pushToast.mockReset();
	});

	afterEach(() => {
		// Puts `console.warn` back, which the tests of a failed lookup silence.
		vi.restoreAllMocks();
	});

	describe('what the original action decides', () => {
		it('keeps label, shortcut, tooltip, tone and disabled state of the original', () => {
			const action = wrap(createProps({ draft: publishedGroup as never }));

			expect(action).toMatchObject({
				disabled: false,
				label: 'Veröffentlichen',
				shortcut: 'Ctrl+Alt+P',
				title: 'Alle Änderungen veröffentlichen',
				tone: 'default',
			});
		});

		it('hands the props of the studio on to the original action', () => {
			const props = createProps({ draft: publishedGroup as never });

			wrap(props);

			expect(publishAction).toHaveBeenCalledWith(props);
		});

		it('offers nothing where the original offers nothing', () => {
			publishAction.mockReturnValueOnce(null);

			expect(wrap(createProps({}))).toBeNull();
		});

		it('leaves a button without a handler untouched', () => {
			const alreadyPublished: DocumentActionDescription = {
				disabled: true,
				label: 'Veröffentlichen',
				title: 'Bereits veröffentlicht',
			};
			publishAction.mockReturnValueOnce(alreadyPublished);

			expect(wrap(createProps({}))).toBe(alreadyPublished);
		});

		it('stays the publish action, so filters and other plugins still find it', () => {
			const wrapped = createPublishWithSlugHistoryAction(publishAction);

			expect(wrapped.action).toBe('publish');
		});
	});

	describe('for a department', () => {
		const props = createProps({
			draft: {
				_id: 'drafts.tanz',
				previousSlugs: ['tanz-alt'],
				slug: { current: 'tanzen' },
			} as never,
			id: 'tanz',
			published: { _id: 'tanz', slug: { current: 'tanz' } } as never,
			type: 'department',
		});

		it('remembers the published slug before it publishes', async () => {
			await click(wrap(props));

			expect(studio.execute).toHaveBeenCalledWith([
				{ set: { previousSlugs: ['tanz-alt', 'tanz'] } },
			]);
			expect(calls).toStrictEqual(['patch', 'publish']);
		});

		it('needs no department lookup', async () => {
			await click(wrap(props));

			expect(studio.fetch).not.toHaveBeenCalled();
		});

		it('names the former slugs when the history of a department cannot be worked out', async () => {
			vi.spyOn(console, 'warn').mockReturnValue();
			const broken = createProps({
				draft: {
					_id: 'drafts.tanz',
					previousSlugs: 'tanz-alt',
					slug: { current: 'tanzen' },
				} as never,
				id: 'tanz',
				published: { _id: 'tanz', slug: { current: 'tanz' } } as never,
				type: 'department',
			});

			await click(wrap(broken));

			expect(calls).toStrictEqual(['publish']);
			expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					description: 'Bitte unter „Frühere Slugs“ von Hand eintragen.',
					status: 'warning',
				}),
			);
		});

		it('only publishes when the slug stays', async () => {
			const unchanged = createProps({
				draft: { _id: 'drafts.tanz', slug: { current: 'tanz' } } as never,
				id: 'tanz',
				published: { _id: 'tanz', slug: { current: 'tanz' } } as never,
				type: 'department',
			});

			await click(wrap(unchanged));

			expect(calls).toStrictEqual(['publish']);
		});
	});

	describe('for a group', () => {
		const movedGroup = createProps({
			draft: {
				...publishedGroup,
				_id: 'drafts.yoga',
				department: { _ref: 'weitere-sportarten' },
			} as never,
			published: publishedGroup as never,
		});

		it('remembers the old path before it publishes', async () => {
			await click(wrap(movedGroup));

			expect(studio.execute).toHaveBeenCalledWith([{ set: { previousPaths: ['kurse/yoga'] } }]);
			expect(calls).toStrictEqual(['patch', 'publish']);
		});

		it('looks up both departments in one request for the published values', async () => {
			await click(wrap(movedGroup));

			expect(studio.fetch).toHaveBeenCalledExactlyOnceWith(
				'*[_id in $ids]{ _id, "slug": slug.current }',
				{ ids: ['kurse', 'weitere-sportarten'] },
				{ perspective: 'published', timeout: 5000 },
			);
		});

		it('looks the departments up again when only the slug of a group changes', async () => {
			const renamed = createProps({
				draft: { ...publishedGroup, _id: 'drafts.yoga', slug: { current: 'hatha-yoga' } } as never,
				published: publishedGroup as never,
			});

			await click(wrap(renamed));

			expect(studio.fetch).toHaveBeenCalledOnce();
			expect(studio.execute).toHaveBeenCalledWith([{ set: { previousPaths: ['kurse/yoga'] } }]);
		});

		it('keeps the paths it knew before', async () => {
			const withHistory = createProps({
				draft: {
					...publishedGroup,
					_id: 'drafts.yoga',
					department: { _ref: 'weitere-sportarten' },
					previousPaths: ['fitness/yoga'],
				} as never,
				published: publishedGroup as never,
			});

			await click(wrap(withHistory));

			expect(studio.execute).toHaveBeenCalledWith([
				{ set: { previousPaths: ['fitness/yoga', 'kurse/yoga'] } },
			]);
		});

		it('only publishes when the path stays', async () => {
			const unchanged = createProps({
				draft: { ...publishedGroup, _id: 'drafts.yoga' } as never,
				published: publishedGroup as never,
			});

			await click(wrap(unchanged));

			expect(calls).toStrictEqual(['publish']);
		});

		it('looks nothing up when the department and the slug stay', async () => {
			const unchanged = createProps({
				draft: { ...publishedGroup, _id: 'drafts.yoga' } as never,
				published: publishedGroup as never,
			});

			await click(wrap(unchanged));

			expect(studio.fetch).not.toHaveBeenCalled();
		});

		it('publishes a new group without looking anything up', async () => {
			await click(wrap(createProps({ draft: { ...publishedGroup, _id: 'drafts.yoga' } as never })));

			expect(studio.fetch).not.toHaveBeenCalled();
			expect(calls).toStrictEqual(['publish']);
		});

		it('still publishes when the departments cannot be looked up', async () => {
			studio.fetch.mockRejectedValue(new Error('offline'));
			vi.spyOn(console, 'warn').mockReturnValue();

			await click(wrap(movedGroup));

			expect(calls).toStrictEqual(['publish']);
		});

		it('tells the editor to fill in the former address by hand when the lookup fails', async () => {
			const error = new Error('offline');
			studio.fetch.mockRejectedValue(error);
			const warn = vi.spyOn(console, 'warn').mockReturnValue();

			await click(wrap(movedGroup));

			expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					description: 'Bitte unter „Frühere Adressen“ von Hand eintragen.',
					status: 'warning',
					title: 'Die frühere Adresse konnte nicht gespeichert werden.',
				}),
			);
			expect(warn).toHaveBeenCalledWith(expect.any(String), error);
		});

		it('says nothing when the history was saved', async () => {
			const warn = vi.spyOn(console, 'warn').mockReturnValue();

			await click(wrap(movedGroup));

			expect(studio.pushToast).not.toHaveBeenCalled();
			expect(warn).not.toHaveBeenCalled();
		});

		it('still publishes when a department has no slug', async () => {
			studio.fetch.mockResolvedValue([
				{ _id: 'kurse', slug: 'kurse' },
				{ _id: 'weitere-sportarten', slug: null },
			]);

			await click(wrap(movedGroup));

			expect(calls).toStrictEqual(['patch', 'publish']);
		});

		// A reference may point at a department that is only a draft, which the published perspective
		// does not return. The old address has to be recorded now, because the editors have no way to
		// know what it was once the group is published.
		it('remembers the old path when the group moves into a department that is only a draft', async () => {
			studio.fetch.mockResolvedValue([{ _id: 'kurse', slug: 'kurse' }]);

			await click(wrap(movedGroup));

			expect(studio.execute).toHaveBeenCalledWith([{ set: { previousPaths: ['kurse/yoga'] } }]);
			expect(calls).toStrictEqual(['patch', 'publish']);
		});

		it('publishes once when the button is clicked again while the departments load', async () => {
			const action = wrap(movedGroup);

			await Promise.all([click(action), click(action)]);

			expect(originalOnHandle).toHaveBeenCalledOnce();
		});

		it('can be clicked again after the first click has been handled', async () => {
			const action = wrap(movedGroup);

			await click(action);
			await click(action);

			expect(originalOnHandle).toHaveBeenCalledTimes(2);
		});
	});
});
