import { describe, expect, it } from 'vite-plus/test';

import siteSettings from './site-settings';

interface SettingsField {
	description?: string;
	name: string;
	of?: { type: string }[];
}

const mainNavigation = (siteSettings as unknown as { fields: SettingsField[] }).fields.find(
	(field) => field.name === 'mainNavigation',
);

describe('main menu of the site settings', () => {
	it('offers a link first and a menu second when an entry is added', () => {
		expect(mainNavigation?.of).toStrictEqual([
			{ type: 'mainNavigationLink' },
			{ type: 'mainNavigationMenu' },
		]);
	});

	// WEB-371: editors misread the old model, so the field names both kinds and what each does.
	it('explains the two kinds of entries to editors', () => {
		expect(mainNavigation?.description).toBe(
			'Links und Menüs der Hauptnavigation. Ein Link führt direkt zu einer Seite oder URL, ein Menü öffnet ein Aufklappmenü mit Unterpunkten.',
		);
	});
});
