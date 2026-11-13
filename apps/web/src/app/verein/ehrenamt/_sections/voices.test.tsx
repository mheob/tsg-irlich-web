import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Testimonial, VoicesSection } from '../_shared/types';
import { Voices } from './voices';

const SECTION: VoicesSection = {
	intro: 'In unseren eigenen Worten.',
	subtitle: 'Stimmen aus dem Verein',
	testimonials: [],
	title: 'Darum machen wir mit',
};

function buildTestimonial(overrides: Partial<Testimonial> = {}): Testimonial {
	return {
		_id: 'testimonial-1',
		firstName: 'Max',
		image: { _type: 'extendedImage', alt: 'Max Mustermann' },
		lastName: 'Mustermann',
		quote: 'Ich habe als Spieler angefangen und pfeife heute selbst.',
		role: 'Schiedsrichter',
		...overrides,
	};
}

describe('the voices section of the volunteer page', () => {
	it('shows the header and each quote with name and role', () => {
		const { getByRole, getByText } = renderWithUser(
			<Voices section={SECTION} testimonials={[buildTestimonial()]} />,
		);

		expect(getByRole('heading', { level: 2, name: 'Darum machen wir mit' })).not.toBeNull();
		expect(getByText('„Ich habe als Spieler angefangen und pfeife heute selbst.“')).not.toBeNull();
		expect(getByText('Max Mustermann')).not.toBeNull();
		expect(getByText('Schiedsrichter')).not.toBeNull();
	});

	it('shows one quote per testimonial', () => {
		const { getAllByRole } = renderWithUser(
			<Voices
				section={SECTION}
				testimonials={[
					buildTestimonial(),
					buildTestimonial({ _id: 'testimonial-2', firstName: 'Erika' }),
				]}
			/>,
		);

		expect(getAllByRole('blockquote')).toHaveLength(2);
	});

	it('shows the initials where the testimonial has no portrait', () => {
		const { getByText } = renderWithUser(
			<Voices section={SECTION} testimonials={[buildTestimonial()]} />,
		);

		expect(getByText('MM')).not.toBeNull();
	});

	it('leaves the section out without testimonials', () => {
		const { container } = renderWithUser(<Voices section={SECTION} testimonials={[]} />);

		expect(container.innerHTML).toBe('');
	});
});
