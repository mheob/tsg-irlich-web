import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { Highlighted } from './highlighted';

describe('a highlighted text', () => {
	it('wraps the matched prefix of a word in a mark', () => {
		const { container, getByText } = renderWithUser(<Highlighted text="Tanzen" words={['tanz']} />);

		expect(getByText('Tanz').tagName).toBe('MARK');
		expect(container.textContent).toBe('Tanzen');
	});

	it('marks every place a search word starts a word, in any case', () => {
		const { container } = renderWithUser(
			<Highlighted text="Tanzen und Turnen" words={['tanz', 'turn']} />,
		);

		expect([...container.querySelectorAll('mark')].map((mark) => mark.textContent)).toStrictEqual([
			'Tanz',
			'Turn',
		]);
		expect(container.textContent).toBe('Tanzen und Turnen');
	});

	it('marks nothing in the middle of a word', () => {
		const { container } = renderWithUser(<Highlighted text="Distanz" words={['tanz']} />);

		expect(container.querySelector('mark')).toBeNull();
		expect(container.textContent).toBe('Distanz');
	});

	it('shows the text as it is without search words', () => {
		const { container } = renderWithUser(<Highlighted text="Tanzen" words={[]} />);

		expect(container.querySelector('mark')).toBeNull();
		expect(container.textContent).toBe('Tanzen');
	});

	it('shows nothing for an empty text', () => {
		const { container } = renderWithUser(<Highlighted text="" words={['tanz']} />);

		expect(container.textContent).toBe('');
	});
});
