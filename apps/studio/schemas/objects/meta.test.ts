import type { ValidationContext } from 'sanity';
import { describe, expect, it, vi } from 'vitest';

import type { NamedImageInput } from '@/components/named-image-input';

import meta from './meta';

// `meta.tsx` wires the open graph image field to `NamedImageInput`, a component that pulls in
// `sanity-plugin-media` purely for its upload UI. That package's CJS/ESM interop with
// `react-dropzone` breaks under Vitest, and `NamedImageInput` also reads Studio-only environment
// variables through `@/env` that this suite has no reason to set up. None of that is reachable
// from the `alt` field's validation function under test, so the component is stubbed out here to
// let the schema module load without altering it. `vi.mock` calls are hoisted above imports by
// Vitest, so this still applies before `./meta` is evaluated.
vi.mock(import('@/components/named-image-input'), () => ({
	NamedImageInput: (() => null) as unknown as typeof NamedImageInput,
}));

type AltValidator = (value: string | undefined, context: ValidationContext) => true | string;

interface FakeRule {
	custom: (fn: AltValidator) => AltValidator;
}

interface MetaSchema {
	readonly fields: readonly {
		readonly fields?: readonly { readonly validation?: (rule: FakeRule) => AltValidator }[];
	}[];
}

function getAltValidator(): AltValidator {
	const fakeRule: FakeRule = { custom: (fn) => fn };
	// `openGraphImage` is the third top-level field, and `alt` is its first nested field — see
	// `schemas/objects/meta.tsx`.
	const altField = (meta as unknown as MetaSchema).fields[2]?.fields?.[0];
	if (!altField?.validation) {
		throw new Error('Expected the open graph image alt field to declare a validation function.');
	}
	return altField.validation(fakeRule);
}

function contextWithAsset(assetRef: string): ValidationContext {
	return { parent: { asset: { _ref: assetRef } } } as unknown as ValidationContext;
}

function contextWithoutAsset(): ValidationContext {
	return { parent: {} } as unknown as ValidationContext;
}

describe('open graph image alt text validation', () => {
	it('passes when an image is selected and alt text is provided', () => {
		const validate = getAltValidator();

		expect(validate('Vereinslogo', contextWithAsset('image-abc'))).toBe(true);
	});

	it('fails when an image is selected but no alt text is provided', () => {
		const validate = getAltValidator();

		expect(validate(undefined, contextWithAsset('image-abc'))).toBe(
			'Alt-Text ist erforderlich wenn ein Bild ausgewählt wurde',
		);
	});

	it('fails with the same message for an empty alt text string', () => {
		const validate = getAltValidator();

		expect(validate('', contextWithAsset('image-abc'))).toBe(
			'Alt-Text ist erforderlich wenn ein Bild ausgewählt wurde',
		);
	});

	it('passes when no image is selected, even without alt text', () => {
		const validate = getAltValidator();

		expect(validate(undefined, contextWithoutAsset())).toBe(true);
	});

	it('passes when no image is selected but alt text happens to be set', () => {
		const validate = getAltValidator();

		expect(validate('Vereinslogo', contextWithoutAsset())).toBe(true);
	});

	it('passes when the parent is entirely undefined', () => {
		const validate = getAltValidator();

		expect(validate(undefined, { parent: undefined } as unknown as ValidationContext)).toBe(true);
	});
});
