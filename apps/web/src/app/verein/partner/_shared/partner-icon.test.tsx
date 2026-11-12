import { describe, expect, it } from 'vite-plus/test';

import { PARTNER_ICONS } from '@tsgi-web/shared/partner-icons';

import { renderWithUser } from '../../../../../test-utils/render';
import { PartnerIcon } from './partner-icon';

describe('the icon of a partner page card', () => {
	it.each(PARTNER_ICONS.map(({ value }) => value))('draws an icon for %s', (icon) => {
		const { container } = renderWithUser(<PartnerIcon icon={icon} />);

		expect(container.querySelector('svg')).not.toBeNull();
	});

	it.each(['unbekannt', undefined, null])('draws nothing for %s', (icon) => {
		const { container } = renderWithUser(<PartnerIcon icon={icon} />);

		expect(container.querySelector('svg')).toBeNull();
	});
});
