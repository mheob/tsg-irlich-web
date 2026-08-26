import { RiTeamLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import { getGroupDocument } from './group';

interface GroupPreviewSelection {
	readonly sortOrder?: number;
	readonly title?: string;
}

function prepareGroupPreview(selection: GroupPreviewSelection): PreviewValue {
	const definition = getGroupDocument({
		icon: RiTeamLine,
		name: 'group.test',
		title: 'Testgruppe',
	});
	return (definition.preview.prepare as unknown as (value: GroupPreviewSelection) => PreviewValue)(
		selection,
	);
}

interface TrainingContext {
	readonly document?: { readonly title?: string };
}

type TrainingValidator = (value: unknown, context: TrainingContext) => true | string;

interface FakeRule {
	custom: (fn: TrainingValidator) => TrainingValidator;
}

interface GroupDocumentSchema {
	readonly fields: readonly {
		readonly name: string;
		readonly validation?: (rule: FakeRule) => readonly [TrainingValidator];
	}[];
}

function getTrainingValidator(isSportGroup?: boolean): TrainingValidator {
	const fakeRule: FakeRule = { custom: (fn) => fn };
	const definition = getGroupDocument({
		icon: RiTeamLine,
		isSportGroup,
		name: 'group.test',
		title: 'Testgruppe',
	});
	const trainingField = (definition as unknown as GroupDocumentSchema).fields.find(
		(field) => field.name === 'training',
	);
	if (!trainingField?.validation) {
		throw new Error('Expected the training field to declare a validation function.');
	}
	const [validate] = trainingField.validation(fakeRule);
	return validate;
}

describe('group document preview', () => {
	it('assembles the subtitle from the sort order and passes the title through', () => {
		const result = prepareGroupPreview({ sortOrder: 3, title: 'Fußball' });

		expect(result).toStrictEqual({ subtitle: 'Sortierreihenfolge: 3', title: 'Fußball' });
	});

	// Regression case: `sortOrder` and this `prepare` were both introduced together in commit
	// ad6c28f ("add sorting for group overview", Jun 2025) — after the group document types already
	// existed (the `getGroupDocument` factory itself dates back to commit b8a5bdf, and all seven
	// group schemas built from it predate ad6c28f). The field carries no `initialValue`, and no
	// migration script anywhere in this repo backfills `sortOrder` — the same shape of gap as the
	// `spacer.ts` defect. `sortOrder` is `Rule.required()`, so Studio does flag a document missing
	// it with a validation error, but that only surfaces once an editor opens the document; it does
	// not retroactively populate a value or stop a stale, not-yet-revisited document from still
	// rendering in the list. Any group document that predates that commit and has not since been
	// re-opened and saved with a sort order shows this exact "Sortierreihenfolge: undefined" title
	// in the Studio document list today — a real, minor, Studio-only defect that this test pins
	// rather than fixes.
	it('stringifies a missing sort order as the literal word "undefined"', () => {
		const result = prepareGroupPreview({ title: 'Fußball' });

		expect(result).toStrictEqual({ subtitle: 'Sortierreihenfolge: undefined', title: 'Fußball' });
	});

	it('passes a missing title through as undefined', () => {
		const result = prepareGroupPreview({ sortOrder: 1 });

		expect(result.title).toBeUndefined();
	});
});

describe('group training time requirement', () => {
	it('requires training times for a sport group whose document title is not "Schiedsrichter"', () => {
		const validate = getTrainingValidator(true);

		expect(validate(undefined, { document: { title: 'Fußball' } })).toBe(
			'Trainingszeiten und -orte sind erforderlich',
		);
	});

	it('passes for a sport group once training times are set', () => {
		const validate = getTrainingValidator(true);

		expect(validate({ trainingDescription: 'x' }, { document: { title: 'Fußball' } })).toBe(true);
	});

	it('exempts a sport group document titled "Schiedsrichter", case-insensitively, even without training times', () => {
		const validate = getTrainingValidator(true);

		expect(validate(undefined, { document: { title: 'SCHIEDSRICHTER' } })).toBe(true);
	});

	it('requires training times when the document has no title yet', () => {
		const validate = getTrainingValidator(true);

		expect(validate(undefined, { document: {} })).toBe(
			'Trainingszeiten und -orte sind erforderlich',
		);
	});

	it('requires training times by default, since the factory defaults isSportGroup to true', () => {
		const validate = getTrainingValidator();

		expect(validate(undefined, { document: { title: 'Fußball' } })).toBe(
			'Trainingszeiten und -orte sind erforderlich',
		);
	});

	it('never requires training times for a non-sport group, even without training times', () => {
		const validate = getTrainingValidator(false);

		expect(validate(undefined, { document: { title: 'Verwaltung' } })).toBe(true);
	});
});
