import { describe, expect, it } from 'vite-plus/test';

import { getMailHref } from './mail';

const INQUIRY = { email: 'info@tsg-irlich.de', subject: 'Ehrenamt bei der TSG Irlich' };

describe('the mail link of an inquiry', () => {
	it('encodes the subject', () => {
		expect(getMailHref(INQUIRY)).toBe(
			'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich',
		);
	});

	it('appends a topic to the subject and encodes its special characters', () => {
		expect(getMailHref(INQUIRY, 'Co-Trainer/in F-Jugend & mehr?')).toBe(
			'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich%3A%20Co-Trainer%2Fin%20F-Jugend%20%26%20mehr%3F',
		);
	});

	it('takes the subject as it is for an empty topic', () => {
		expect(getMailHref(INQUIRY, '')).toBe(
			'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich',
		);
	});
});
