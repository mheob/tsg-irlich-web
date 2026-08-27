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

	it('falls back to the secondary colours', async () => {
		const html = await render(EmailButton({ href: 'https://example.com', label: 'Mehr' }));

		expect(html).toContain('bg-secondary');
		expect(html).toContain('border-secondary-foreground');
		expect(html).toContain('text-secondary-foreground');
	});

	it('renders the primary variant with the primary colours', async () => {
		const html = await render(
			EmailButton({ href: 'https://example.com', label: 'Mehr', variant: 'primary' }),
		);

		expect(html).toContain('bg-primary');
		expect(html).toContain('border-primary-foreground');
		expect(html).toContain('text-primary-foreground');
		expect(html).not.toContain('secondary');
	});
});
