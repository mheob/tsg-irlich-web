import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { EventDateBadge } from './event-date-badge';

describe('event date badge', () => {
	it('renders the weekday, day and month of the event', async () => {
		const html = await render(EventDateBadge({ day: '23', month: 'Dez', weekday: 'Mi' }));

		expect(html).toContain('>Mi<');
		expect(html).toContain('>23<');
		expect(html).toContain('>Dez<');
	});
});
