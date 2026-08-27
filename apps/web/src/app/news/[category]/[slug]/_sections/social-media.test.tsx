import { describe, expect, it } from 'vitest';

import type { SocialMediaQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { SocialMedia } from './social-media';

// Until the visitor interacts with it, every `ContactLink` reports this generic name instead of
// its target — see `src/components/with-logic/contact-link.test.tsx`.
const CONTACT_LINK_NAME = 'Kontaktlink - tippen zum Anzeigen';

function buildSocialMedia(fields: Record<string, string>): SocialMediaQueryResult {
	// The generated result type carries the document meta fields as well.
	return fields as unknown as SocialMediaQueryResult;
}

describe('the social media links beside an article', () => {
	it('heads the list with its own title', () => {
		const { getByRole } = renderWithUser(
			<SocialMedia socialMedia={buildSocialMedia({ instagram: 'https://instagram.example' })} />,
		);

		expect(getByRole('heading', { name: 'Folge uns!' })).not.toBeNull();
	});

	it('reveals each channel once the visitor interacts with it', async () => {
		const { getAllByRole, user } = renderWithUser(
			<SocialMedia
				socialMedia={buildSocialMedia({
					facebook: 'https://facebook.example',
					instagram: 'https://instagram.example',
				})}
			/>,
		);

		const links = getAllByRole('button', { name: CONTACT_LINK_NAME });
		await Promise.all(links.map(async (link) => user.hover(link)));

		expect(links.map((link) => link.getAttribute('href'))).toStrictEqual([
			'https://facebook.example',
			'https://instagram.example',
		]);
	});

	it('renders nothing without a social media document', () => {
		const { container } = renderWithUser(<SocialMedia socialMedia={null} />);

		expect(container.textContent).toBe('');
	});
});
