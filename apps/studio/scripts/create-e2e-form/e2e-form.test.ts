// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { validateFormFields } from '@/utils/form-validation';

import { E2E_FORM, readDataset } from './e2e-form';

describe('the dataset of the e2e form', () => {
	it('reads the dataset after the separator of sanity exec', () => {
		expect(readDataset(['--', '--dataset', 'development'])).toBe('development');
	});

	it('reads the dataset without a separator', () => {
		expect(readDataset(['--dataset', 'development'])).toBe('development');
	});

	it('refuses to guess a dataset', () => {
		expect(() => readDataset([])).toThrow('--dataset fehlt');
	});

	it('refuses production', () => {
		expect(() => readDataset(['--dataset', 'production'])).toThrow('nicht nach production');
	});

	it('refuses an unknown option', () => {
		expect(() => readDataset(['--dataset', 'development', '--force'])).toThrow(/--force/u);
	});
});

describe('the e2e form', () => {
	it('is a published registration form at the slug the suite opens', () => {
		expect(E2E_FORM).toMatchObject({
			_id: 'e2e-anmeldung',
			formType: 'registration',
			slug: { current: 'e2e-anmeldung' },
		});
		expect(E2E_FORM._id.startsWith('drafts.')).toBe(false);
	});

	it('passes the studio check of the field markers', () => {
		expect(validateFormFields(E2E_FORM.fields, E2E_FORM)).toBe(true);
	});
});
