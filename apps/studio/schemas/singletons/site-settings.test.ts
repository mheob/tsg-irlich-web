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

interface ChainRule {
	assetRequired: () => ChainRule;
	error: (message: string) => ChainRule;
	length: (count: number) => ChainRule;
	required: () => ChainRule;
}

interface ValidatedDefinition {
	group?: string;
	name?: string;
	of?: ValidatedDefinition[];
	title?: string;
	type?: string;
	validation?: (rule: ChainRule) => unknown;
}

const settingsFields = (siteSettings as unknown as { fields: ValidatedDefinition[] }).fields;

function settingsField(name: string): ValidatedDefinition {
	const found = settingsFields.find((field) => field.name === name);
	if (!found) {
		throw new Error(`Expected the site settings to have a "${name}" field.`);
	}
	return found;
}

/**
 * Runs a validation against a rule that only writes down the calls it receives, which is all a
 * builder chain like `Rule.required().length(3)` leaves to look at.
 *
 * @param definition - The field or array member.
 * @returns The calls of the chain, in order, with their argument.
 */
function recordValidationChain(definition: ValidatedDefinition | undefined): string[] {
	if (!definition?.validation) {
		throw new Error('Expected the definition to validate.');
	}

	const calls: string[] = [];
	const rule: ChainRule = {
		assetRequired: () => {
			calls.push('assetRequired');
			return rule;
		},
		error: (message) => {
			calls.push(`error: ${message}`);
			return rule;
		},
		length: (count) => {
			calls.push(`length: ${count}`);
			return rule;
		},
		required: () => {
			calls.push('required');
			return rule;
		},
	};
	definition.validation(rule);
	return calls;
}

describe('images of the site settings', () => {
	it('keeps the three central images in their own group', () => {
		expect(
			['visionImages', 'contactFormImages', 'fallbackImage'].map(
				(name) => settingsField(name).group,
			),
		).toStrictEqual(['images', 'images', 'images']);
		expect(
			(siteSettings as unknown as { groups: { name: string; title: string }[] }).groups.at(-1),
		).toStrictEqual({ name: 'images', title: 'Bilder' });
	});

	it.each([
		['visionImages', 'Vision-Bilder', 'Die Vision-Sektion braucht genau drei Bilder'],
		[
			'contactFormImages',
			'Kontaktformular-Bilder',
			'Das Kontaktformular braucht genau drei Bilder',
		],
	])('requires exactly three %s', (name, title, message) => {
		expect(settingsField(name)).toMatchObject({ title, type: 'array' });
		expect(recordValidationChain(settingsField(name))).toStrictEqual([
			'required',
			'length: 3',
			`error: ${message}`,
		]);
	});

	it.each(['visionImages', 'contactFormImages'])(
		'requires a file for every image of %s',
		(name) => {
			const members = settingsField(name).of;

			expect(members).toHaveLength(1);
			expect(members?.[0]?.type).toBe('extendedImage');
			expect(recordValidationChain(members?.[0])).toStrictEqual([
				'required',
				'assetRequired',
				'error: Jedes Bild braucht eine Datei',
			]);
		},
	);

	it('requires a fallback image with a file', () => {
		expect(settingsField('fallbackImage')).toMatchObject({
			title: 'Ersatzbild Angebot',
			type: 'extendedImage',
		});
		expect(recordValidationChain(settingsField('fallbackImage'))).toStrictEqual([
			'required',
			'assetRequired',
			'error: Das Ersatzbild ist erforderlich',
		]);
	});
});
