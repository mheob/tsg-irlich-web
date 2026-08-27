import { describe, expect, it, vi } from 'vitest';

import type { client } from '@/lib/sanity/client';

import { renderWithUser } from '../../../test-utils/render';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import Footer from './footer';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

const ADDRESS = 'Gotenstraße 20, 56567 Neuwied';

// Until the visitor interacts with it, every `ContactLink` reports this generic name instead of
// its target — see `src/components/with-logic/contact-link.test.tsx`.
const CONTACT_LINK_NAME = 'Kontaktlink - tippen zum Anzeigen';

/**
 * Renders the footer, which is an async server component.
 *
 * @param socialMedia - The social media document the fetch resolves with.
 * @returns The render result.
 */
async function renderFooter(socialMedia: unknown = null) {
	mockedFetch.mockResolvedValue(socialMedia);
	return renderWithUser(await Footer());
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

	// Every `ContactLink` hides its target until the visitor interacts with it, and until then it
	// carries the same generic name — so the club address is reached by hovering it and reading the
	// href it then reveals.
	it('reveals the club email address once the visitor interacts with it', async () => {
		const { getAllByRole, user } = await renderFooter();

		const contactLinks = getAllByRole('button', { name: CONTACT_LINK_NAME });
		await Promise.all(contactLinks.map(async (link) => user.hover(link)));

		expect(contactLinks.map((link) => link.getAttribute('href'))).toContain(
			'mailto:info@tsg-irlich.de',
		);
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

	it('offers a jump back to the top of the page', async () => {
		const { getByRole } = await renderFooter();

		expect(getByRole('link', { name: 'zum Seitenanfang springen' }).getAttribute('href')).toBe(
			'#top',
		);
	});

	it('lists the social media channels the document carries', async () => {
		const { getAllByRole, user } = await renderFooter({
			facebook: 'https://facebook.example/tsg',
			instagram: 'https://instagram.example/tsg',
		});

		const contactLinks = getAllByRole('button', { name: CONTACT_LINK_NAME });
		await Promise.all(contactLinks.map(async (link) => user.hover(link)));
		const targets = contactLinks.map((link) => link.getAttribute('href'));

		expect(targets).toContain('https://instagram.example/tsg');
		expect(targets).toContain('https://facebook.example/tsg');
	});

	it('shows only the email link when the document carries no social media', async () => {
		const { getAllByRole } = await renderFooter();

		expect(getAllByRole('button', { name: CONTACT_LINK_NAME })).toHaveLength(1);
	});

	it('skips a platform the document has no url for', async () => {
		const { getAllByRole } = await renderFooter({ facebook: '', instagram: 'https://x.example' });

		expect(getAllByRole('button', { name: CONTACT_LINK_NAME })).toHaveLength(2);
	});
});
