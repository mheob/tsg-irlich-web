import { describe, expect, it } from 'vite-plus/test';

import {
	dueSubmissionsQuery,
	formByIdQuery,
	formPageQuery,
	formRegisteredCountQuery,
} from './forms';

describe('form queries', () => {
	// The page hands its data to client components, so an address here would be published in the HTML.
	it('keeps the receivers out of the page query', () => {
		expect(formPageQuery).not.toContain('receivers');
		expect(formPageQuery).not.toContain('email,');
	});

	it('reads the receivers with their addresses for the action', () => {
		expect(formByIdQuery).toContain('receivers[] { email, name }');
	});

	it('projects the same field attributes in both queries', () => {
		expect(formPageQuery).toContain('isConfirmationRecipient');
		expect(formByIdQuery).toContain('isConfirmationRecipient');
	});

	it('counts only registered, published submissions', () => {
		expect(formRegisteredCountQuery).toContain('status == "registered"');
		expect(formRegisteredCountQuery).toContain('!(_id in path("drafts.**"))');
	});

	it('selects the submissions whose clean-up day has come', () => {
		expect(dueSubmissionsQuery).toContain('form->cleanupAt <= now()');
		expect(dueSubmissionsQuery).toContain('!defined(cleanedAt)');
	});
});
