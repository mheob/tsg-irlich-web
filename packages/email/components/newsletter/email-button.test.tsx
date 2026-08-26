import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { EmailButton } from './email-button';

describe('email button', () => {
	it('renders its href and label', async () => {
		const html = await render(
			EmailButton({ href: 'https://example.com/mitgliedschaft', label: 'Mitglied werden' }),
		);

		expect(html).toContain('href="https://example.com/mitgliedschaft"');
		expect(html).toContain('>Mitglied werden<');
	});
});
