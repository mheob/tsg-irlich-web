import { describe, expect, it } from 'vite-plus/test';

import { contactPageQuery } from './contact';

describe('contact queries', () => {
	// WEB-410: the page hands the receivers to a client component, so every field the query keeps
	// ends up in the HTML and the RSC payload. The server action looks the address up by key.
	it('hands the page the receivers without their addresses', () => {
		expect(contactPageQuery).toContain('receiver[] { _key, name }');
	});
});
