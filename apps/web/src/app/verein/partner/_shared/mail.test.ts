import { describe, expect, it } from 'vite-plus/test';

import { getMailHref } from './mail';

const INQUIRY = { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' };

describe('the mail link of an inquiry', () => {
	it('uses the subject as it is without a topic', () => {
		expect(getMailHref(INQUIRY)).toBe(
			'mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich',
		);
	});

	it('appends an encoded topic to the subject', () => {
		expect(getMailHref(INQUIRY, 'Trikot & Bande?')).toBe(
			'mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich%3A%20Trikot%20%26%20Bande%3F',
		);
	});
});
