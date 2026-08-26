import { describe, expect, it } from 'vitest';

import documentDownloadField from './document-download';

type DocumentValidator = (file?: { asset?: { mimeType?: string } }) => true | string;

interface FakeRule {
	custom: (fn: DocumentValidator) => DocumentValidator;
	error: () => FakeRule;
	required: () => FakeRule;
}

interface DocumentDownloadSchema {
	readonly fields: readonly {
		readonly name: string;
		readonly validation?: (rule: FakeRule) => readonly [unknown, DocumentValidator];
	}[];
}

function getDocumentValidator(): DocumentValidator {
	const fakeRule: FakeRule = {
		custom: (fn) => fn,
		error() {
			return fakeRule;
		},
		required() {
			return fakeRule;
		},
	};
	const documentField = (documentDownloadField as unknown as DocumentDownloadSchema).fields.find(
		(field) => field.name === 'document',
	);
	if (!documentField?.validation) {
		throw new Error('Expected the document field to declare a validation function.');
	}
	const [, validate] = documentField.validation(fakeRule);
	return validate;
}

describe('document download file type validation', () => {
	it('passes for a PDF asset', () => {
		const validate = getDocumentValidator();

		expect(validate({ asset: { mimeType: 'application/pdf' } })).toBe(true);
	});

	it('fails for a non-PDF asset with the exact German message', () => {
		const validate = getDocumentValidator();

		expect(validate({ asset: { mimeType: 'image/png' } })).toBe('Nur PDF-Dateien sind erlaubt');
	});

	// This custom rule only rejects a wrong MIME type; presence is `Rule.required()`'s job, which
	// the builder chain declares separately and which these two cases therefore do not cover. Both
	// pinned deliberately: a rule that threw or rejected on a half-uploaded asset would block the
	// editor mid-upload, so passing here is the intended behaviour, not a hole in the predicate.
	it('passes when no file has been uploaded yet', () => {
		const validate = getDocumentValidator();

		expect(validate()).toBe(true);
	});

	it('passes when the asset has not resolved a mime type yet', () => {
		const validate = getDocumentValidator();

		expect(validate({ asset: {} })).toBe(true);
	});
});
