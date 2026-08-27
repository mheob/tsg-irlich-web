import { describe, expect, it } from 'vitest';

import { singletonPlugin } from './singleton';

interface FakeAction {
	readonly action: string;
}

interface FakeTemplateItem {
	readonly templateId: string;
}

type ActionsResolver = (previous: FakeAction[], context: { schemaType: string }) => FakeAction[];

type NewDocumentOptionsResolver = (
	previous: FakeTemplateItem[],
	context: { creationContext: { type: string } },
) => FakeTemplateItem[];

describe('singleton plugin document actions', () => {
	it('strips the duplicate action for a listed type', () => {
		const plugin = singletonPlugin(['site-settings']);
		const actions = plugin.document?.actions as unknown as ActionsResolver;
		const previous: FakeAction[] = [
			{ action: 'publish' },
			{ action: 'duplicate' },
			{ action: 'unpublish' },
		];

		const result = actions(previous, { schemaType: 'site-settings' });

		expect(result).toStrictEqual([{ action: 'publish' }, { action: 'unpublish' }]);
	});

	it('leaves the actions untouched for an unlisted type', () => {
		const plugin = singletonPlugin(['site-settings']);
		const actions = plugin.document?.actions as unknown as ActionsResolver;
		const previous: FakeAction[] = [
			{ action: 'publish' },
			{ action: 'duplicate' },
			{ action: 'unpublish' },
		];

		const result = actions(previous, { schemaType: 'news.article' });

		expect(result).toBe(previous);
	});
});

describe('singleton plugin new document options', () => {
	it('filters listed template items when the creation context is global', () => {
		const plugin = singletonPlugin(['site-settings']);
		const newDocumentOptions = plugin.document
			?.newDocumentOptions as unknown as NewDocumentOptionsResolver;
		const previous: FakeTemplateItem[] = [
			{ templateId: 'site-settings' },
			{ templateId: 'news.article' },
		];

		const result = newDocumentOptions(previous, { creationContext: { type: 'global' } });

		expect(result).toStrictEqual([{ templateId: 'news.article' }]);
	});

	it('returns the template items unchanged for a non-global creation context', () => {
		const plugin = singletonPlugin(['site-settings']);
		const newDocumentOptions = plugin.document
			?.newDocumentOptions as unknown as NewDocumentOptionsResolver;
		const previous: FakeTemplateItem[] = [
			{ templateId: 'site-settings' },
			{ templateId: 'news.article' },
		];

		const result = newDocumentOptions(previous, {
			creationContext: { type: 'structure' },
		});

		expect(result).toBe(previous);
	});
});
