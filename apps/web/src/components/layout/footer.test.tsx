import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import { renderWithUser } from '../../../test-utils/render';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import Footer from './footer';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

const ADDRESS = 'Gotenstraße 20, 56567 Neuwied';

const CONTACT = {
	email: 'info@tsg-irlich.de',
	phone: '+49 2631 76987',
	postalAddress: { city: 'Neuwied', houseNumber: '20', street: 'Gotenstraße', zipCode: '56567' },
};

/**
 * Renders the footer, which is an async server component.
 *
 * @param socialFields - The social media profiles of the site settings.
 * @param contact - The contact details of the site settings.
 * @returns The render result.
 */
async function renderFooter(socialFields: unknown = null, contact: unknown = CONTACT) {
	mockedFetch.mockResolvedValue({ contact, socialFields });
	return renderWithUser(await Footer());
}

/**
 * Picks the contact links out of the footer's buttons: until the visitor interacts with them they
 * are anchors announced as buttons, while the maps trigger is a real button without an href.
 *
 * @param buttons - Every element with the button role.
 * @returns The contact links among them.
 */
function contactLinks(buttons: HTMLElement[]): HTMLElement[] {
	return buttons.filter((button) => button.hasAttribute('href'));
}

describe('the footer', () => {
	it('links back to the home page', async () => {
		const { getByTitle } = await renderFooter();

		expect(getByTitle('Zur Startseite wechseln').getAttribute('href')).toBe('/');
	});

	it('shows the address and offers it as a maps link', async () => {
		const { getByText, getByLabelText } = await renderFooter();

		expect(getByText(ADDRESS)).not.toBeNull();
		expect(getByLabelText(`Besuche uns im Pappelstadion: ${ADDRESS}`)).not.toBeNull();
	});

	// A `ContactLink` hides its target until the visitor interacts with it, but is named by the
	// address it shows (WCAG 2.5.3) — see `src/components/with-logic/contact-link.test.tsx`.
	it('reveals the club email address once the visitor interacts with it', async () => {
		const { getByRole, user } = await renderFooter();

		const link = getByRole('button', { name: 'info@tsg-irlich.de' });
		await user.hover(link);

		expect(link.getAttribute('href')).toBe('mailto:info@tsg-irlich.de');
	});

	it.each([
		['Impressum', '/impressum'],
		['Datenschutz', '/datenschutz'],
		['Barrierefreiheit', '/barrierefreiheit'],
		['Feedback geben', '/kontakt/feedback'],
	])('links to %s', async (label, href) => {
		const { getByRole } = await renderFooter();

		expect(getByRole('link', { name: label }).getAttribute('href')).toBe(href);
	});

	it('names the current year in the copyright line', async () => {
		const { getByText } = await renderFooter();

		const currentYear = new Date().getFullYear();

		expect(getByText(new RegExp(`©${currentYear} TSG Irlich`, 'u'))).not.toBeNull();
	});

	it('names its navigation landmark, which carries the legal links and the jump back to the top', async () => {
		const { getByRole } = await renderFooter();

		const navigation = getByRole('navigation', { name: 'Fußzeilennavigation' });

		expect(navigation.querySelectorAll('a')).toHaveLength(4);
	});

	it('offers a jump back to the top of the page', async () => {
		const { getByRole } = await renderFooter();

		expect(getByRole('link', { name: 'zum Seitenanfang springen' }).getAttribute('href')).toBe(
			'#top',
		);
	});

	it('leaves out the address and the email link when the site settings carry none', async () => {
		const { queryByText, queryAllByRole } = await renderFooter(null, {
			email: null,
			postalAddress: null,
		});

		expect(queryByText(ADDRESS)).toBeNull();
		expect(queryAllByRole('button')).toHaveLength(0);
	});

	it('lists the social media channels the document carries', async () => {
		const { getByRole, user } = await renderFooter({
			facebook: 'https://facebook.example/tsg',
			instagram: 'https://instagram.example/tsg',
		});

		const facebook = getByRole('button', { name: 'facebook' });
		const instagram = getByRole('button', { name: 'instagram' });
		await user.hover(facebook);
		await user.hover(instagram);

		expect(facebook.getAttribute('href')).toBe('https://facebook.example/tsg');
		expect(instagram.getAttribute('href')).toBe('https://instagram.example/tsg');
	});

	it('shows only the email link when the document carries no social media', async () => {
		const { getAllByRole } = await renderFooter();

		expect(contactLinks(getAllByRole('button'))).toHaveLength(1);
	});

	it('skips a platform the document has no url for', async () => {
		const { getAllByRole, queryByRole } = await renderFooter({
			facebook: '',
			instagram: 'https://x.example',
		});

		expect(contactLinks(getAllByRole('button'))).toHaveLength(2);
		expect(queryByRole('button', { name: 'facebook' })).toBeNull();
	});
});
