import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import echoIssue from './echo.issue';

interface EchoIssueSelection {
	readonly media?: PreviewValue['media'];
	readonly releaseDate?: string;
	readonly status?: string;
	readonly title?: string;
}

function prepare(selection: EchoIssueSelection): PreviewValue {
	return (echoIssue.preview.prepare as unknown as (value: EchoIssueSelection) => PreviewValue)(
		selection,
	);
}

function field(name: string): { readOnly?: boolean; group?: string } | undefined {
	return (
		echoIssue.fields as unknown as { group?: string; name: string; readOnly?: boolean }[]
	).find((candidate) => candidate.name === name);
}

describe('echo issue preview', () => {
	it('shows the year and that the pages are ready', () => {
		expect(
			prepare({ releaseDate: '2025-04-01', status: 'done', title: 'TSG ECHO 2025' }),
		).toStrictEqual({
			media: undefined,
			subtitle: '2025 · Seiten fertig',
			title: 'TSG ECHO 2025',
		});
	});

	it('says that pages are being generated while a run is pending', () => {
		expect(prepare({ releaseDate: '2025-04-01', status: 'pending', title: 'X' }).subtitle).toBe(
			'2025 · Seiten werden erzeugt',
		);
	});

	it('flags a failed run', () => {
		expect(prepare({ releaseDate: '2025-04-01', status: 'failed', title: 'X' }).subtitle).toBe(
			'2025 · Fehler beim Erzeugen',
		);
	});

	it('says that there are no pages yet before the first run', () => {
		expect(prepare({ releaseDate: '2025-04-01', title: 'X' }).subtitle).toBe(
			'2025 · Noch keine Seiten',
		);
	});

	it('leaves out a missing release date', () => {
		expect(prepare({ status: 'done', title: 'X' }).subtitle).toBe('Seiten fertig');
	});

	it('passes the cover through as media', () => {
		expect(prepare({ media: 'image-cover', title: 'X' }).media).toBe('image-cover');
	});
});

describe('echo issue fields', () => {
	// Editors must never edit what the render route writes; the route treats these as its own.
	it.each(['pages', 'extractedText', 'render'])('keeps %s read-only in the pages group', (name) => {
		expect(field(name)).toMatchObject({ group: 'pages', readOnly: true });
	});

	it('lets editors write the intro in the general group', () => {
		expect(field('intro')).toMatchObject({ group: 'general' });
		expect(field('intro')?.readOnly).toBeUndefined();
	});
});
