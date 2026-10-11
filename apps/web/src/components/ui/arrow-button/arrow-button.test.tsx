import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { ArrowButton, ArrowElement, ArrowLink } from './arrow-button';

// Which arrow a direction picks is only visible through the icon `lucide-react` renders, and that
// difference lives in a class name — so the cases below pin that each direction renders exactly one
// icon and that the surrounding element keeps its role, label and disabled state.
describe('arrow button', () => {
	it('is a button that can be pressed', async () => {
		const { getByRole, user } = renderWithUser(<ArrowButton aria-label="Weiter" size="size-8" />);

		const button = getByRole('button', { name: 'Weiter' });
		await user.click(button);

		expect(button.getAttribute('type')).toBe('button');
	});

	it('can be disabled', () => {
		const { getByRole } = renderWithUser(
			<ArrowButton aria-label="Weiter" size="size-8" disabled />,
		);

		expect((getByRole('button', { name: 'Weiter' }) as HTMLButtonElement).disabled).toBe(true);
	});

	it.each([
		['down'],
		['down-left'],
		['down-right'],
		['left'],
		['right'],
		['up'],
		['up-left'],
		['up-right'],
	] as const)('renders an icon for the %s direction', (direction) => {
		const { getByRole } = renderWithUser(
			<ArrowButton aria-label="Pfeil" direction={direction} size="size-8" />,
		);

		expect(getByRole('button', { name: 'Pfeil' }).querySelectorAll('svg')).toHaveLength(1);
	});

	it('renders no icon for a direction it does not know', () => {
		const { getByRole } = renderWithUser(
			// The prop type only allows the eight known directions; a value from the CMS can still
			// reach it, and the component answers that with no icon at all.
			<ArrowButton aria-label="Pfeil" direction={'sideways' as 'left'} size="size-8" />,
		);

		expect(getByRole('button', { name: 'Pfeil' }).querySelectorAll('svg')).toHaveLength(0);
	});
});

describe('arrow link', () => {
	it('is a link to the given target', () => {
		const { getByRole } = renderWithUser(
			<ArrowLink aria-label="Weiter" href="/news" size="size-8" />,
		);

		expect(getByRole('link', { name: 'Weiter' }).getAttribute('href')).toBe('/news');
	});
});

describe('arrow element', () => {
	it('renders an arrow that is neither a button nor a link', () => {
		const { getByLabelText, queryByRole } = renderWithUser(
			<ArrowElement aria-label="Weiter" size="size-8" />,
		);

		expect(getByLabelText('Weiter').tagName).toBe('DIV');
		expect(queryByRole('button')).toBeNull();
		expect(queryByRole('link')).toBeNull();
	});
});
