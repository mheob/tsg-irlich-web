import { render } from 'react-email';
import { describe, expect, it } from 'vite-plus/test';

import { FormSubmissionConfirmationEmail } from './form-submission-confirmation';

const sections = [{ heading: 'Kontakt', rows: [{ label: 'Name', value: 'Erika Musterfrau' }] }];

describe('form submission confirmation email', () => {
	it('splits the text into paragraphs', async () => {
		const html = await render(
			FormSubmissionConfirmationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: false,
				text: 'A\n\nB',
			}),
		);

		expect(html).toContain('lang="de"');
		expect(html).toContain('>A<');
		expect(html).toContain('>B<');
		expect(html.match(/<p /gu)).toHaveLength(2);
	});

	it('renders no sections and no note when none were given', async () => {
		const html = await render(
			FormSubmissionConfirmationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: true,
				text: 'A',
			}),
		);

		expect(html).not.toContain('Kontakt');
		expect(html).not.toContain('führen wir hier nicht auf');
	});

	it('renders sections with the hidden fields note', async () => {
		const html = await render(
			FormSubmissionConfirmationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: true,
				sections,
				text: 'A',
			}),
		);

		expect(html).toContain('Kontakt');
		expect(html).toContain('Erika Musterfrau');
		expect(html).toContain('Adressen und Geburtsdaten führen wir hier nicht auf.');
	});

	it('omits the note when nothing is hidden', async () => {
		const html = await render(
			FormSubmissionConfirmationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: false,
				sections,
				text: 'A',
			}),
		);

		expect(html).not.toContain('führen wir hier nicht auf');
	});
});
