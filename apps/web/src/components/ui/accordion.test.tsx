import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

function renderAccordion(): ReturnType<typeof renderWithUser> {
	return renderWithUser(
		<Accordion>
			<AccordionItem value="first">
				<AccordionTrigger>Frage 1</AccordionTrigger>
				<AccordionContent>Antwort 1</AccordionContent>
			</AccordionItem>
			<AccordionItem value="second">
				<AccordionTrigger>Frage 2</AccordionTrigger>
				<AccordionContent>Antwort 2</AccordionContent>
			</AccordionItem>
		</Accordion>,
	);
}

/**
 * Finds the panel around an answer: the closest element that carries Base UI's panel role.
 *
 * @param text - The text inside the panel.
 * @param getByText - The query of the rendered result.
 * @returns The panel element.
 */
function panelOf(text: string, getByText: (text: string) => HTMLElement): HTMLElement {
	const panel = getByText(text).closest<HTMLElement>('[role="region"]');
	if (!panel) {
		throw new Error(`Expected "${text}" to sit in an accordion panel.`);
	}
	return panel;
}

describe('accordion', () => {
	it('shows each question as a collapsed button inside a level 3 heading', () => {
		const { getByRole } = renderAccordion();

		expect(getByRole('heading', { level: 3, name: 'Frage 1' })).not.toBeNull();
		expect(getByRole('button', { name: 'Frage 1' }).getAttribute('aria-expanded')).toBe('false');
	});

	it('keeps a collapsed answer in the document but hidden', () => {
		const { getByText } = renderAccordion();

		expect(panelOf('Antwort 1', getByText).hasAttribute('hidden')).toBe(true);
	});

	it('opens an answer on click', async () => {
		const { getByRole, getByText, user } = renderAccordion();

		await user.click(getByRole('button', { name: 'Frage 1' }));

		expect(getByRole('button', { name: 'Frage 1' }).getAttribute('aria-expanded')).toBe('true');
		expect(panelOf('Antwort 1', getByText).hasAttribute('hidden')).toBe(false);
	});

	it('keeps several answers open at the same time', async () => {
		const { getByRole, user } = renderAccordion();

		await user.click(getByRole('button', { name: 'Frage 1' }));
		await user.click(getByRole('button', { name: 'Frage 2' }));

		expect(getByRole('button', { name: 'Frage 1' }).getAttribute('aria-expanded')).toBe('true');
		expect(getByRole('button', { name: 'Frage 2' }).getAttribute('aria-expanded')).toBe('true');
	});
});
