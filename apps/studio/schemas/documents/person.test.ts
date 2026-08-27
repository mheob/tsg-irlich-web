import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import person from './person';

interface PersonSelection {
	readonly firstName?: string;
	readonly lastName?: string;
	readonly media?: PreviewValue['media'];
	readonly team1?: string;
	readonly team2?: string;
	readonly team3?: string;
	readonly team4?: string;
	readonly team5?: string;
}

function preparePerson(selection: PersonSelection): PreviewValue {
	return (person.preview.prepare as unknown as (value: PersonSelection) => PreviewValue)(selection);
}

interface AffiliationSelection {
	readonly role?: string;
	readonly team?: string;
}

interface PersonSchema {
	readonly fields: readonly {
		readonly name: string;
		readonly of?: readonly {
			readonly preview?: {
				readonly prepare?: (value: AffiliationSelection) => { title: string };
			};
		}[];
	}[];
}

function prepareAffiliation(selection: AffiliationSelection): { title: string } {
	const affiliationsField = (person as unknown as PersonSchema).fields.find(
		(field) => field.name === 'affiliations',
	);
	const prepare = affiliationsField?.of?.[0]?.preview?.prepare;
	if (!prepare) {
		throw new Error('Expected the affiliation array member to declare a preview.prepare function.');
	}
	return prepare(selection);
}

describe('person preview', () => {
	it('assembles the title and joins every affiliated team into the subtitle', () => {
		const media = 'media-asset-abc';

		const result = preparePerson({
			firstName: 'Anna',
			lastName: 'Schmidt',
			media,
			team1: 'Fußball',
			team2: 'Turnen',
			team3: 'Tanzen',
			team4: 'Leichtathletik',
			team5: 'Vorstand',
		});

		expect(result).toStrictEqual({
			media,
			subtitle: 'Fußball, Turnen, Tanzen, Leichtathletik, Vorstand',
			title: 'Schmidt, Anna',
		});
	});

	it('drops missing teams from the subtitle and keeps the remaining ones in order', () => {
		const result = preparePerson({
			firstName: 'Anna',
			lastName: 'Schmidt',
			team1: 'Fußball',
			team3: 'Tanzen',
		});

		expect(result.subtitle).toBe('Fußball, Tanzen');
	});

	it('drops an empty string team name from the subtitle', () => {
		const result = preparePerson({
			firstName: 'Anna',
			lastName: 'Schmidt',
			team1: 'Fußball',
			team2: '',
		});

		expect(result.subtitle).toBe('Fußball');
	});

	it('returns an empty subtitle when the person has no affiliated teams', () => {
		const result = preparePerson({ firstName: 'Anna', lastName: 'Schmidt' });

		expect(result.subtitle).toBe('');
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = preparePerson({ firstName: 'Anna', lastName: 'Schmidt', media });

		expect(result.media).toBe(media);
	});
});

describe('person affiliation preview', () => {
	it('assembles the title from the team and role', () => {
		const result = prepareAffiliation({ role: 'Vorstand Finanzen', team: 'Fußball' });

		expect(result).toStrictEqual({ title: 'Gruppe: Fußball - Rolle: Vorstand Finanzen' });
	});

	// Regression case: `prepare` interpolates the two selected reference titles straight into a
	// template literal, so an unset or unresolved reference renders as the literal string
	// "undefined" in the array item's preview. Both `team` and `role` carry `Rule.required()`, but
	// Sanity validation gates publishing, not autosave — a freshly added affiliation item shows
	// "Gruppe: undefined - Rolle: undefined" until both references are picked. Lower severity than
	// the `spacer`/`group` defects: this one heals as soon as the references are set, whereas those
	// two leave pre-existing documents permanently stuck. Pinned rather than fixed, since
	// production code is out of scope here.
	it('stringifies a missing team as the literal word "undefined"', () => {
		const result = prepareAffiliation({ role: 'Vorstand Finanzen' });

		expect(result.title).toBe('Gruppe: undefined - Rolle: Vorstand Finanzen');
	});

	it('stringifies a missing role as the literal word "undefined"', () => {
		const result = prepareAffiliation({ team: 'Fußball' });

		expect(result.title).toBe('Gruppe: Fußball - Rolle: undefined');
	});
});
