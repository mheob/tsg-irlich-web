import type { DocumentDefinition } from 'sanity';
import type { StructureResolverContext } from 'sanity/structure';
import { describe, expect, it } from 'vite-plus/test';

import { SinglePageInput } from '@/components/single-page-input';
import { DIVIDER_TITLE, createFakeStructureBuilder } from '@/test-utils/fake-structure-builder';
import type { FakeBuilder } from '@/test-utils/fake-structure-builder';

import { pageStructure, singletonPlugin } from './singleton';

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

describe('page structure', () => {
	it('lists the pages first, then the shared documents by title, then the settings', () => {
		const structureBuilder = createFakeStructureBuilder([
			{ name: 'testimonial', title: 'Zeugnis / Referenz' },
			{ name: 'venue', title: 'Sportstätte' },
			{ name: 'news.article', title: 'News-Artikel' },
			{ name: 'media.folder', title: 'Media Folder' },
			{ name: 'sponsors', title: 'Sponsoren' },
			{ name: 'home', title: 'Startseite' },
		]);
		const singletons = [{ name: 'home', title: 'Startseite' }] as DocumentDefinition[];

		const root = pageStructure(singletons)(
			structureBuilder,
			{} as StructureResolverContext,
		) as FakeBuilder;

		expect(root.getItems().map((item) => item.getTitle())).toStrictEqual([
			'Startseite',
			'Verein',
			'News',
			'Angebot',
			DIVIDER_TITLE,
			'FAQ',
			'Formulare',
			'Personen',
			'Sponsoren',
			'Sportstätte',
			'Zeugnis / Referenz',
			DIVIDER_TITLE,
			'KI-Anweisungen',
			'Generelle Einstellungen',
		]);
	});
});

describe('singleton plugin form', () => {
	it('puts the place of a single page above its form', () => {
		const plugin = singletonPlugin(['site-settings']);

		expect(plugin.form?.components?.input).toBe(SinglePageInput);
	});
});
