import { describe, expect, it } from 'vite-plus/test';

import { blockText } from '../../../../../test-utils/form-fields';
import { PAGE_HERO_IMAGE } from '../../../../../test-utils/page-images';
import { renderWithUser } from '../../../../../test-utils/render';
import { RegistrationInfo } from './registration-info';

// `src/lib/sanity/api.ts` asserts the project variables at import time, and the info column reaches
// it through the image URL builder.
const INTRO = blockText('Alles zum Dorfturnier.') as unknown as Parameters<
	typeof RegistrationInfo
>[0]['intro'];

function renderInfo(props: Partial<Parameters<typeof RegistrationInfo>[0]> = {}) {
	return renderWithUser(
		<RegistrationInfo
			eventDate="2027-05-14T11:00:00Z"
			heroImage={PAGE_HERO_IMAGE}
			intro={INTRO}
			location="Pappelstadion"
			registrationEnd="2027-04-30T21:59:00Z"
			title="Dorfturnier 2027"
			{...props}
		/>,
	);
}

describe('registration info', () => {
	it('shows date, place and deadline chips', () => {
		const { getByText } = renderInfo();

		expect(getByText('Fr., 14.05.2027, 13:00 Uhr')).not.toBeNull();
		expect(getByText('Pappelstadion')).not.toBeNull();
		expect(getByText('bis Fr., 30.04.2027, 23:59 Uhr')).not.toBeNull();
	});

	it('leaves out the chips the form has no value for', () => {
		const { queryByText } = renderInfo({ eventDate: null, location: null, registrationEnd: null });

		expect(queryByText('Pappelstadion')).toBeNull();
		expect(queryByText(/^bis /u)).toBeNull();
		expect(queryByText(/Uhr$/u)).toBeNull();
	});

	it('repeats the title as a second level heading', () => {
		const { getByRole } = renderInfo();

		expect(getByRole('heading', { level: 2, name: 'Dorfturnier 2027' })).not.toBeNull();
	});

	it('shows the remaining places', () => {
		const { getByText } = renderInfo({ notice: 'Noch 3 von 8 Plätzen frei' });

		expect(getByText('Noch 3 von 8 Plätzen frei')).not.toBeNull();
	});

	it('shows no notice without one', () => {
		const { queryByText } = renderInfo();

		expect(queryByText(/Plätzen frei/u)).toBeNull();
	});

	it('puts image and intro behind "Mehr zur Veranstaltung"', () => {
		const { getByRole } = renderInfo();

		const trigger = getByRole('button', { name: 'Mehr zur Veranstaltung' });
		const panel = trigger.nextElementSibling as HTMLElement;

		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(panel.hidden).toBe(true);
		expect(panel.textContent).toContain('Alles zum Dorfturnier.');
		expect(panel.querySelector('img')).not.toBeNull();
	});

	it('opens the details with the trigger', async () => {
		const { getAllByText, getByRole, user } = renderInfo();

		const trigger = getByRole('button', { name: 'Mehr zur Veranstaltung' });

		await user.click(trigger);

		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect((trigger.nextElementSibling as HTMLElement).hidden).toBe(false);
		// The other copy is always visible from the large breakpoint on.
		expect(getAllByText('Alles zum Dorfturnier.')).toHaveLength(2);
	});

	it('has no trigger when there is neither image nor intro', () => {
		const { queryByRole } = renderInfo({ heroImage: null, intro: null });

		expect(queryByRole('button', { name: 'Mehr zur Veranstaltung' })).toBeNull();
	});

	// The hero above the column describes the image already.
	it('marks the repeated image as decorative', () => {
		const { container } = renderInfo();
		const images = [...container.querySelectorAll('img')];

		expect(images).toHaveLength(2);
		expect(images.map((image) => image.getAttribute('alt'))).toStrictEqual(['', '']);
	});

	it('shows the intro without an image', () => {
		const { container } = renderInfo({ heroImage: null });

		expect(container.querySelector('img')).toBeNull();
	});
});
