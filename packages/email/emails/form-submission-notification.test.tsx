import { render } from 'react-email';
import { describe, expect, it } from 'vite-plus/test';

import { FormSubmissionNotificationEmail } from './form-submission-notification';

const sections = [
	{ heading: 'Kontakt', rows: [{ label: 'Name', value: 'Erika Musterfrau' }] },
	{ rows: [{ label: 'Größe', value: 'M' }] },
];

describe('form submission notification email', () => {
	it('renders the copy, sections and studio link', async () => {
		const html = await render(
			FormSubmissionNotificationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: true,
				sections,
				status: 'registered',
				studioUrl: 'https://studio.example.com/eingang/1',
			}),
		);

		expect(html).toContain('Neuer Eingang: Sommerfest');
		expect(html).toContain('Status: angemeldet');
		expect(html).toContain('Adressen und Geburtsdaten stehen nur im Studio.');
		expect(html).toContain('Eingang im Studio öffnen');
		expect(html).toContain('href="https://studio.example.com/eingang/1"');
	});

	it('renders the answer sections in a german document', async () => {
		const html = await render(
			FormSubmissionNotificationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: false,
				sections,
				status: 'registered',
				studioUrl: 'https://studio.example.com/eingang/1',
			}),
		);

		expect(html).toContain('lang="de"');
		expect(html).toContain('Kontakt');
		expect(html).toContain('Erika Musterfrau');
		expect(html).toContain('Größe');
	});

	it('shows the waitlist status and omits the hidden fields note', async () => {
		const html = await render(
			FormSubmissionNotificationEmail({
				formTitle: 'Sommerfest',
				hasHiddenFields: false,
				sections,
				status: 'waitlist',
				studioUrl: 'https://studio.example.com/eingang/1',
			}),
		);

		expect(html).toContain('Status: Warteliste');
		expect(html).not.toContain('nur im Studio');
	});
});
