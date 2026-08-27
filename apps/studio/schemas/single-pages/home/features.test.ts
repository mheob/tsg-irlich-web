import { describe, expect, it } from 'vitest';

import { featuresField } from './features';

type FeaturesValidator = (features?: readonly unknown[]) => true | string;

interface FakeRule {
	custom: (fn: FeaturesValidator) => FeaturesValidator;
}

interface FeaturesSchema {
	readonly fields: readonly {
		readonly name: string;
		readonly validation?: (rule: FakeRule) => readonly [FeaturesValidator];
	}[];
}

function getFeaturesValidator(): FeaturesValidator {
	const fakeRule: FakeRule = { custom: (fn) => fn };
	const featuresArrayField = (featuresField as unknown as FeaturesSchema).fields.find(
		(field) => field.name === 'features',
	);
	if (!featuresArrayField?.validation) {
		throw new Error('Expected the features array field to declare a validation function.');
	}
	const [validate] = featuresArrayField.validation(fakeRule);
	return validate;
}

function featureList(count: number): { readonly _key: string }[] {
	return Array.from({ length: count }, (_unused, index) => ({ _key: `feature-${index}` }));
}

describe('feature count validation', () => {
	it('passes for exactly 4 features', () => {
		const validate = getFeaturesValidator();

		expect(validate(featureList(4))).toBe(true);
	});

	it('passes for exactly 6 features', () => {
		const validate = getFeaturesValidator();

		expect(validate(featureList(6))).toBe(true);
	});

	it('fails with the exact German message for 5 features', () => {
		const validate = getFeaturesValidator();

		expect(validate(featureList(5))).toBe('Es müssen genau 4 oder 6 Merkmale gewählt werden');
	});

	it('fails with the exact German message when no features are set', () => {
		const validate = getFeaturesValidator();

		expect(validate()).toBe('Es müssen genau 4 oder 6 Merkmale gewählt werden');
	});
});
