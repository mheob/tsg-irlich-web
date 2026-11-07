import { SiFacebook, SiWhatsapp } from '@icons-pack/react-simple-icons';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { SocialMediaIcon } from './social-media-icon';

describe('the social media icon', () => {
	it('links a public profile directly, so crawlers and visitors without JavaScript can follow it', () => {
		const { getByRole } = renderWithUser(
			<SocialMediaIcon
				href="https://www.facebook.com/tsg.irlich"
				icon={SiFacebook}
				label="facebook"
			/>,
		);

		const link = getByRole('link', { name: 'facebook' });
		expect(link.getAttribute('href')).toBe('https://www.facebook.com/tsg.irlich');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('keeps the phone number of the WhatsApp link out of the markup until someone uses it', async () => {
		const { getByRole, user } = renderWithUser(
			<SocialMediaIcon href="https://wa.me/4926311234" icon={SiWhatsapp} label="whatsapp" />,
		);

		const guarded = getByRole('button', { name: 'whatsapp' });
		expect(guarded.getAttribute('href')).toBe('#');

		await user.hover(guarded);

		expect(getByRole('link', { name: 'whatsapp' }).getAttribute('href')).toBe(
			'https://wa.me/4926311234',
		);
	});
});
