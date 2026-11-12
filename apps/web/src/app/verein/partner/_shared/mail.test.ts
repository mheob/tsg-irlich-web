import { describe, expect, it } from 'vite-plus/test';

import { getMailHref } from './mail';

const INQUIRY = { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' };

describe('the mail link of an inquiry', () => {
	it('encodes the subject', () => {
		expect(getMailHref(INQUIRY)).toBe(
			'mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich',
		);
	});
});
