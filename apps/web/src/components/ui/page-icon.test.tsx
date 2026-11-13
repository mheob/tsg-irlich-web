import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { renderWithUser } from '../../../test-utils/render';
import { PageIcon } from './page-icon';

describe('the icon of a page card', () => {
	it.each(PAGE_ICONS.map(({ value }) => value))('draws an icon for %s', (icon) => {
		const { container } = renderWithUser(<PageIcon icon={icon} />);

		expect(container.querySelector('svg')).not.toBeNull();
	});

	it.each(['unbekannt', undefined, null])('draws nothing for %s', (icon) => {
		const { container } = renderWithUser(<PageIcon icon={icon} />);

		expect(container.querySelector('svg')).toBeNull();
	});
});
