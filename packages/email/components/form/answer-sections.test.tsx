import { render } from 'react-email';
import { describe, expect, it } from 'vite-plus/test';

import { AnswerSections } from './answer-sections';

describe('answer sections', () => {
	it('renders headings, labels and values', async () => {
		const html = await render(
			<AnswerSections
				sections={[
					{ heading: 'Kontakt', rows: [{ label: 'Name', value: 'Erika Musterfrau' }] },
					{ rows: [{ label: 'Größe', value: 'M' }] },
				]}
			/>,
		);

		expect(html).toContain('Kontakt');
		expect(html).toContain('Name');
		expect(html).toContain('Erika Musterfrau');
		expect(html).toContain('Größe');
		expect(html).toContain('>M<');
	});

	it('keeps the line breaks of a multi-line value', async () => {
		const html = await render(
			<AnswerSections
				sections={[
					{ rows: [{ label: 'Anmerkung', value: 'Zeile eins\r\nZeile zwei\nZeile drei' }] },
				]}
			/>,
		);

		expect(html).toMatch(/Zeile eins<br\s*\/?>Zeile zwei<br\s*\/?>Zeile drei/u);
	});

	it('renders nothing for an empty list', async () => {
		const html = await render(<AnswerSections sections={[]} />);

		expect(html).not.toContain('<h2');
	});
});
