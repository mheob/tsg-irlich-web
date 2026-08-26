import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { UpcomingEvents } from './upcoming-events';

describe('upcoming events', () => {
	it('renders nothing for an empty list', async () => {
		const html = await render(UpcomingEvents({ events: [] }));

		expect(html).not.toContain('<table');
		expect(html).not.toContain('Blick voraus');
	});

	it('renders one entry per event', async () => {
		const events = [
			{ day: '07', meta: 'Halle · 18 Uhr', month: 'Aug', title: 'Trainingsauftakt', weekday: 'Mo' },
			{ day: '14', meta: 'Sportplatz · 10 Uhr', month: 'Sep', title: 'Punktspiel', weekday: 'Sa' },
		];

		const html = await render(UpcomingEvents({ events }));

		for (const event of events) {
			expect(html.split(event.title).length - 1).toBe(1);
			expect(html).toContain(event.meta);
		}
	});
});
