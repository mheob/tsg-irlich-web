import { render, within } from '@testing-library/react';
import { renderToReadableStream } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import type { DepartmentPageQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { encodeLikeDraftMode } from '../../../../../test-utils/stega';
import { Faq } from './faq';

type DepartmentFaq = NonNullable<DepartmentPageQueryResult>['faqs'][number];

function faq(id: string, question: null | string, answer: string): DepartmentFaq {
	return {
		_id: id,
		answer: answer
			? [
					{
						_key: `${id}-block`,
						_type: 'block',
						children: [{ _key: `${id}-span`, _type: 'span', marks: [], text: answer }],
						markDefs: [],
						style: 'normal',
					},
				]
			: [],
		answerText: answer,
		isMarkedUp: true,
		question,
	} as DepartmentFaq;
}

const TRIAL = faq('faq-trial', 'Gibt es ein Probetraining?', 'Ja, jederzeit.');

describe('faq section', () => {
	it('heads the section with its title and the department', () => {
		const { getByRole, getByText } = renderWithUser(
			<Faq
				departmentTitle="Fußball"
				faqs={[TRIAL]}
				intro="Was uns oft gefragt wird"
				subtitle="Fragen und Antworten"
				title="Häufige Fragen"
			/>,
		);

		expect(getByRole('heading', { level: 2, name: 'Häufige Fragen Fußball' })).not.toBeNull();
		expect(getByText('Fragen und Antworten')).not.toBeNull();
		expect(getByText('Was uns oft gefragt wird')).not.toBeNull();
	});

	it('falls back to "Häufige Fragen" and "FAQ" without a heading from the studio', () => {
		const { getByRole, getByText } = renderWithUser(
			<Faq departmentTitle="Fußball" faqs={[TRIAL]} />,
		);

		expect(getByRole('heading', { level: 2, name: 'Häufige Fragen Fußball' })).not.toBeNull();
		expect(getByText('FAQ')).not.toBeNull();
	});

	it('lists each question as a collapsed button', () => {
		const { getByRole } = renderWithUser(<Faq departmentTitle="Fußball" faqs={[TRIAL]} />);

		expect(
			getByRole('button', { name: 'Gibt es ein Probetraining?' }).getAttribute('aria-expanded'),
		).toBe('false');
	});

	it('shows the answer after a click', async () => {
		const { getByRole, getByText, user } = renderWithUser(
			<Faq departmentTitle="Fußball" faqs={[TRIAL]} />,
		);

		await user.click(getByRole('button', { name: 'Gibt es ein Probetraining?' }));

		expect(getByText('Ja, jederzeit.').closest('[hidden]')).toBeNull();
	});

	it('renders a link in an answer', async () => {
		const withLink = {
			...TRIAL,
			answer: [
				{
					_key: 'block',
					_type: 'block',
					children: [{ _key: 'span', _type: 'span', marks: ['link'], text: 'Anfahrt' }],
					markDefs: [{ _key: 'link', _type: 'externalLink', href: 'https://example.org/' }],
					style: 'normal',
				},
			],
		} as DepartmentFaq;
		const { getByRole, user } = renderWithUser(<Faq departmentTitle="Fußball" faqs={[withLink]} />);

		await user.click(getByRole('button', { name: 'Gibt es ein Probetraining?' }));

		expect(getByRole('link', { name: /Anfahrt/u }).getAttribute('href')).toBe(
			'https://example.org/',
		);
	});

	it('leaves out a question without answer', () => {
		const { queryByRole } = renderWithUser(
			<Faq departmentTitle="Fußball" faqs={[TRIAL, faq('faq-empty', 'Wo wird trainiert?', '')]} />,
		);

		expect(queryByRole('button', { name: 'Wo wird trainiert?' })).toBeNull();
		expect(queryByRole('button', { name: 'Gibt es ein Probetraining?' })).not.toBeNull();
	});

	it('renders nothing when no question is complete', () => {
		const { container } = renderWithUser(
			<Faq departmentTitle="Fußball" faqs={[faq('faq-empty', null, 'Ja.')]} />,
		);

		expect(container.innerHTML).toBe('');
	});

	it('leaves out a draft question whose blank answer carries the draft mode encoding', () => {
		const blank = {
			...faq('faq-blank', 'Wo wird trainiert?', ''),
			answerText: encodeLikeDraftMode(''),
		};
		const { queryByRole } = renderWithUser(<Faq departmentTitle="Fußball" faqs={[TRIAL, blank]} />);

		expect(queryByRole('button', { name: 'Wo wird trainiert?' })).toBeNull();
	});

	// Crawlers read the server HTML, so a closed answer has to be in it, only hidden.
	it('renders a closed answer into the server HTML, hidden', async () => {
		const stream = await renderToReadableStream(<Faq departmentTitle="Fußball" faqs={[TRIAL]} />);
		const html = await new Response(stream).text();
		// The markup comes straight out of the component under test, nothing external is injected.
		// oxlint-disable-next-line react/no-danger
		const { container } = render(<div dangerouslySetInnerHTML={{ __html: html }} />);

		expect(within(container).getByText('Ja, jederzeit.').closest('[hidden]')).not.toBeNull();
	});
});
