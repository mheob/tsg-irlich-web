import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { ContactForwardEmail } from './contact-forward';

describe('contact forward email', () => {
	it('mentions the receiver when one was passed', async () => {
		const html = await render(
			ContactForwardEmail({
				contactEmail: 'anfrage@example.com',
				contactMessage: 'Hallo, ich habe eine Frage.',
				contactName: 'Erika Musterfrau',
				receiver: 'Jugendabteilung',
			}),
		);

		expect(html).toContain('Zuständigkeit');
		expect(html).toContain('Jugendabteilung');
		expect(html).not.toContain('allgemeine Anfrage');
	});

	it('falls back to a general message when no receiver was passed', async () => {
		const html = await render(
			ContactForwardEmail({
				contactEmail: 'anfrage@example.com',
				contactMessage: 'Hallo, ich habe eine Frage.',
				contactName: 'Erika Musterfrau',
			}),
		);

		expect(html).toContain('Hi! Es gibt eine neue, allgemeine Anfrage.');
		expect(html).not.toContain('Zuständigkeit');
	});

	it('includes the contact name, e-mail and message', async () => {
		const html = await render(
			ContactForwardEmail({
				contactEmail: 'anfrage@example.com',
				contactMessage: 'Zeile eins\nZeile zwei',
				contactName: 'Erika Musterfrau',
			}),
		);

		expect(html).toContain('Erika Musterfrau');
		expect(html).toContain('href="mailto:anfrage@example.com"');
		expect(html).toContain('anfrage@example.com');
		expect(html).toContain('Zeile eins<br/>');
		expect(html).toContain('Zeile zwei');
	});
});
