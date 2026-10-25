import { describe, expect, it } from 'vite-plus/test';

import type { SocialMediaQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { SocialMedia } from './social-media';

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
		const { getByRole, user } = renderWithUser(
			<SocialMedia
				socialMedia={buildSocialMedia({
					facebook: 'https://facebook.example',
					instagram: 'https://instagram.example',
				})}
			/>,
		);

		const facebook = getByRole('button', { name: 'facebook' });
		const instagram = getByRole('button', { name: 'instagram' });
		await user.hover(facebook);
		await user.hover(instagram);

		expect(facebook.getAttribute('href')).toBe('https://facebook.example');
		expect(instagram.getAttribute('href')).toBe('https://instagram.example');
	});

	it('renders nothing without a social media document', () => {
		const { container } = renderWithUser(<SocialMedia socialMedia={null} />);

		expect(container.textContent).toBe('');
	});
});
