import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { ArrowButton, ArrowElement, ArrowLink } from './arrow-button';
import { ArrowButtonGroup } from './arrow-button-group';

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
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
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

describe('arrow button group', () => {
	it('offers a button for each direction', () => {
		const { getByRole } = renderWithUser(<ArrowButtonGroup />);

		expect(getByRole('button', { name: 'Zurück' })).not.toBeNull();
		expect(getByRole('button', { name: 'Weiter' })).not.toBeNull();
	});

	it('disables the buttons it was told to disable', () => {
		const { getByRole } = renderWithUser(<ArrowButtonGroup isDisabledPrevious />);

		expect((getByRole('button', { name: 'Zurück' }) as HTMLButtonElement).disabled).toBe(true);
		expect((getByRole('button', { name: 'Weiter' }) as HTMLButtonElement).disabled).toBe(false);
	});

	it('links both directions when it was given targets', () => {
		const { getByRole } = renderWithUser(
			<ArrowButtonGroup hrefNext="/news?seite=3" hrefPrev="/news?seite=1" type="link" />,
		);

		expect(getByRole('link', { name: 'Zurück' }).getAttribute('href')).toBe('/news?seite=1');
		expect(getByRole('link', { name: 'Weiter' }).getAttribute('href')).toBe('/news?seite=3');
	});

	it('drops the link of a disabled direction instead of pointing nowhere', () => {
		const { getByLabelText, getByRole, queryByRole } = renderWithUser(
			<ArrowButtonGroup
				hrefNext="/news?seite=3"
				hrefPrev="/news?seite=1"
				type="link"
				isDisabledPrevious
			/>,
		);

		expect(queryByRole('link', { name: 'Zurück' })).toBeNull();
		expect(getByLabelText('Zurück').getAttribute('aria-disabled')).toBe('true');
		expect(getByRole('link', { name: 'Weiter' })).not.toBeNull();
	});

	it('drops the link of the next direction when that one is disabled', () => {
		const { getByLabelText, getByRole, queryByRole } = renderWithUser(
			<ArrowButtonGroup
				hrefNext="/news?seite=3"
				hrefPrev="/news?seite=1"
				type="link"
				isDisabledNext
			/>,
		);

		expect(queryByRole('link', { name: 'Weiter' })).toBeNull();
		expect(getByLabelText('Weiter').getAttribute('aria-disabled')).toBe('true');
		expect(getByRole('link', { name: 'Zurück' })).not.toBeNull();
	});

	it('renders as the given element instead of a div when render is set', () => {
		const { getByRole } = renderWithUser(
			<ArrowButtonGroup render={<nav aria-label="Blättern" />} />,
		);

		const group = getByRole('navigation', { name: 'Blättern' });
		expect(group.tagName).toBe('NAV');
		expect(group.querySelectorAll('button')).toHaveLength(2);
	});
});
