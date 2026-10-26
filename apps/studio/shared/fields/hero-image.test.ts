import { describe, expect, it } from 'vite-plus/test';

import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from './hero-image';

interface ChainRule {
	assetRequired: () => ChainRule;
	error: (message: string) => ChainRule;
	required: () => ChainRule;
}

interface ValidatedField {
	readonly validation?: (rule: ChainRule) => unknown;
}

/**
 * Runs the validation of a field against a rule that only writes down the calls it receives, which
 * is all a builder chain like `Rule.required().assetRequired()` leaves to look at.
 *
 * @param field - The field definition.
 * @returns The calls of the chain, in order, with the message of `error`.
 */
function recordValidationChain(field: ValidatedField): string[] {
	if (!field.validation) {
		throw new Error('Expected the field to validate.');
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
		required: () => {
			calls.push('required');
			return rule;
		},
	};
	field.validation(rule);
	return calls;
}

describe('hero image field', () => {
	it('is an extended image named heroImage in the general group', () => {
		expect(getHeroImageField('Beschreibung')).toMatchObject({
			group: 'general',
			name: 'heroImage',
			title: 'Hero-Bild',
			type: 'extendedImage',
		});
	});

	it('carries the description it is given', () => {
		expect(getHeroImageField('Beschreibung').description).toBe('Beschreibung');
	});

	it('requires an image with a file', () => {
		expect(
			recordValidationChain(getHeroImageField('Beschreibung') as unknown as ValidatedField),
		).toStrictEqual(['required', 'assetRequired', 'error: Das Hero-Bild ist erforderlich']);
	});

	it('tells editors how the banner crops a landscape image', () => {
		expect(LANDSCAPE_HERO_DESCRIPTION).toBe(
			'Querformat. Das Banner zeigt je nach Bildschirm nur einen Teil des Bildes, der Hotspot bestimmt, welcher Teil sichtbar bleibt. Ohne eigenes Open-Graph-Bild dient es auch als Vorschaubild beim Teilen.',
		);
	});
});
