import type { PreviewValue, Reference, ValidationContext } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import person, { getTeamFilter, validateTeamMatchesDepartment } from './person';

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

	// A board member's affiliation has only a role, since the group and the department are optional.
	it('shows only the role when there is no team', () => {
		expect(prepareAffiliation({ role: 'Vorstand Finanzen' })).toStrictEqual({
			title: 'Rolle: Vorstand Finanzen',
		});
	});

	it('shows only the team when there is no role yet', () => {
		expect(prepareAffiliation({ team: 'Fußball' })).toStrictEqual({ title: 'Gruppe: Fußball' });
	});

	it('names an affiliation with neither team nor role', () => {
		expect(prepareAffiliation({})).toStrictEqual({ title: 'Zugehörigkeit ohne Gruppe und Rolle' });
	});
});

interface ContextOptions {
	readonly affiliationDepartment?: string;
	/** The department of the chosen group; `undefined` when the group has none. */
	readonly teamDepartment?: string;
}

// The validation context of the team of an affiliation; the client answers with `teamDepartment`.
function contextFor({ affiliationDepartment, teamDepartment }: ContextOptions): {
	context: ValidationContext;
	fetch: ReturnType<typeof vi.fn>;
	getClient: ReturnType<typeof vi.fn>;
} {
	const fetch = vi.fn().mockResolvedValue(teamDepartment);
	const getClient = vi.fn(() => ({ fetch }));
	const context = {
		getClient,
		parent: {
			department: affiliationDepartment ? { _ref: affiliationDepartment } : undefined,
		},
	} as unknown as ValidationContext;
	return { context, fetch, getClient };
}

function getAffiliationField(name: string): Record<string, unknown> {
	const affiliations = (person as unknown as PersonSchema).fields.find(
		(field) => field.name === 'affiliations',
	);
	const field = (
		affiliations?.of?.[0] as unknown as { fields: Record<string, unknown>[] } | undefined
	)?.fields.find((candidate) => candidate.name === name);
	if (!field) {
		throw new Error(`Expected the affiliation to declare a "${name}" field.`);
	}
	return field;
}

const GROUP_REFERENCE: Reference = { _ref: 'g1', _type: 'reference' };

describe('person affiliation fields', () => {
	it('references the department document and does not require it', () => {
		const field = getAffiliationField('department');

		expect(field).toMatchObject({ to: [{ type: 'department' }], type: 'reference' });
		expect(field.validation).toBeUndefined();
	});

	it('references the group document, filtered by department', () => {
		expect(getAffiliationField('team')).toMatchObject({
			options: { filter: getTeamFilter },
			to: [{ type: 'group' }],
			type: 'reference',
		});
	});

	// A mismatch must not block publishing: the department is optional and the editor may mean it.
	it('only warns when the group does not match the department', () => {
		const validation = getAffiliationField('team').validation as (rule: {
			custom: (fn: unknown) => { warning: () => unknown };
		}) => unknown;
		const rule = { custom: (fn: unknown) => ({ warning: () => fn }) };

		expect(validation(rule)).toBe(validateTeamMatchesDepartment);
	});

	it('keeps the role required', () => {
		const role = getAffiliationField('role');

		expect(role).toMatchObject({ to: [{ type: 'role' }], type: 'reference' });
		expect(role.validation).toBeTypeOf('function');
	});
});

describe('person affiliation team filter', () => {
	it('limits the groups to the chosen department', () => {
		expect(getTeamFilter({ parent: { department: { _ref: 'department-tanzen' } } })).toStrictEqual({
			filter: 'department._ref == $departmentId',
			params: { departmentId: 'department-tanzen' },
		});
	});

	it('offers every group without a department', () => {
		expect(getTeamFilter({ parent: {} })).toStrictEqual({});
	});

	it('offers every group when the affiliation is not known yet', () => {
		expect(getTeamFilter({ parent: undefined })).toStrictEqual({});
	});
});

describe('person affiliation team validation', () => {
	it('warns when the group belongs to another department', async () => {
		const { context } = contextFor({
			affiliationDepartment: 'department-kurse',
			teamDepartment: 'department-fussball',
		});

		await expect(validateTeamMatchesDepartment(GROUP_REFERENCE, context)).resolves.toBe(
			'Die Gruppe gehört nicht zur gewählten Abteilung.',
		);
	});

	it('accepts a group of the chosen department', async () => {
		const { context } = contextFor({
			affiliationDepartment: 'department-fussball',
			teamDepartment: 'department-fussball',
		});

		await expect(validateTeamMatchesDepartment(GROUP_REFERENCE, context)).resolves.toBe(true);
	});

	it('reads the department of the chosen group from the group document', async () => {
		const { context, fetch, getClient } = contextFor({
			affiliationDepartment: 'department-fussball',
			teamDepartment: 'department-fussball',
		});

		await validateTeamMatchesDepartment(GROUP_REFERENCE, context);

		expect(getClient).toHaveBeenCalledWith({ apiVersion: '2026-10-01' });
		expect(fetch).toHaveBeenCalledExactlyOnceWith('*[_id == $id][0].department._ref', {
			id: 'g1',
		});
	});

	it('warns about a group that has no department at all', async () => {
		const { context } = contextFor({
			affiliationDepartment: 'department-fussball',
			teamDepartment: undefined,
		});

		await expect(validateTeamMatchesDepartment(GROUP_REFERENCE, context)).resolves.toBe(
			'Die Gruppe gehört nicht zur gewählten Abteilung.',
		);
	});

	it('accepts an affiliation with only a role', async () => {
		const { context, fetch } = contextFor({ affiliationDepartment: undefined });

		await expect(validateTeamMatchesDepartment(undefined, context)).resolves.toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});

	// Without a department there is nothing the group could contradict, and the filter offers every group.
	it('accepts a group while no department is chosen', async () => {
		const { context, fetch } = contextFor({
			affiliationDepartment: undefined,
			teamDepartment: 'department-fussball',
		});

		await expect(validateTeamMatchesDepartment(GROUP_REFERENCE, context)).resolves.toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});
});
