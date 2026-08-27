import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { FeatureCard } from './feature-card';

describe('the feature card', () => {
	it('shows its title and introduction', () => {
		const { getByText } = renderWithUser(
			<FeatureCard icon="Dumbbell" intro="Über 18 Sportarten." title="Vielfalt" />,
		);

		expect(getByText('Vielfalt')).not.toBeNull();
		expect(getByText('Über 18 Sportarten.')).not.toBeNull();
	});

	// The icons only differ in the class name `lucide-react` renders, so the cases below pin that
	// every known name — and an unknown one, which falls back to a question mark icon — renders
	// exactly one icon, hidden from screen readers.
	it.each([['Dumbbell'], ['Calendar'], ['GraduationCap'], ['House'], ['Turnbeutel']])(
		'renders a decorative icon for %s',
		(icon) => {
			const { container } = renderWithUser(
				<FeatureCard icon={icon} intro="Über 18 Sportarten." title="Vielfalt" />,
			);

			const icons = container.querySelectorAll('svg[aria-hidden="true"]');

			expect(icons).toHaveLength(1);
		},
	);
});
