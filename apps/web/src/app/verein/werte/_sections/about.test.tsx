import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { AboutSection } from '../_shared/types';
import { About } from './about';

const IMAGE = {
	_type: 'extendedImage' as const,
	alt: 'Taekwondo Duell',
	asset: { _ref: 'image-intro123-1600x1200-jpg', _type: 'reference' as const },
};

function buildSection(overrides: Partial<AboutSection> = {}): AboutSection {
	return {
		facts: [
			{ _key: 'founded', _type: 'valuesFact', label: 'gegründet', value: '1882' },
			{ _key: 'colours', _type: 'valuesFact', label: 'Vereinsfarben', value: 'Blau & Gelb' },
		],
		image: IMAGE,
		intro: 'Die TSG Irlich ist einer der ältesten Vereine im Kreis Neuwied.',
		subtitle: 'Wer wir sind',
		title: 'Turn- und Sportgemeinde Irlich 1882 e.V.',
		...overrides,
	};
}

describe('the „Wer wir sind“ section of the values page', () => {
	it('shows the section header and the intro', () => {
		const { getByRole, getByText } = renderWithUser(<About section={buildSection()} />);

		expect(
			getByRole('heading', { level: 2, name: 'Turn- und Sportgemeinde Irlich 1882 e.V.' }),
		).not.toBeNull();
		expect(getByText('Wer wir sind')).not.toBeNull();
		expect(getByText(/einer der ältesten Vereine/u)).not.toBeNull();
	});

	it('pairs every fact with its label in a description list', () => {
		const { container } = renderWithUser(<About section={buildSection()} />);

		const pairs = [...container.querySelectorAll('dl > div')].map((pair) => [
			pair.querySelector('dt')?.textContent,
			pair.querySelector('dd')?.textContent,
		]);

		expect(pairs).toStrictEqual([
			['gegründet', '1882'],
			['Vereinsfarben', 'Blau & Gelb'],
		]);
	});

	it('shows the image by its alt text', () => {
		const { getByRole } = renderWithUser(<About section={buildSection()} />);

		expect(getByRole('img', { name: 'Taekwondo Duell' }).getAttribute('src')).toContain('intro123');
	});

	it('leaves out the image and the facts the editors have not set', () => {
		const { container, queryByRole } = renderWithUser(
			<About section={buildSection({ facts: [], image: undefined })} />,
		);

		expect(queryByRole('img')).toBeNull();
		expect(container.querySelector('dl')).toBeNull();
	});
});
