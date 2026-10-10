import type { PreviewValue } from 'sanity';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import echoIssue from './echo.issue';

interface EchoIssueSelection {
	readonly media?: PreviewValue['media'];
	readonly releaseDate?: string;
	readonly startedAt?: string;
	readonly status?: string;
	readonly title?: string;
}

function prepare(selection: EchoIssueSelection): PreviewValue {
	return (echoIssue.preview.prepare as unknown as (value: EchoIssueSelection) => PreviewValue)(
		selection,
	);
}

function field(
	name: string,
): { description?: string; group?: string; readOnly?: boolean } | undefined {
	return (
		echoIssue.fields as unknown as { group?: string; name: string; readOnly?: boolean }[]
	).find((candidate) => candidate.name === name);
}

describe('echo issue preview', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

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

	// `maxDuration` is 800 s; a run still pending after that was cut off by the platform.
	it('flags a run that stayed pending longer than the route may run', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-10T10:20:00.000Z'));

		const { subtitle } = prepare({
			releaseDate: '2025-04-01',
			startedAt: '2026-10-10T10:00:00.000Z',
			status: 'pending',
			title: 'X',
		});

		expect(subtitle).toBe('2025 · Abgebrochen – „Seiten neu erzeugen“');
	});

	it('still shows a recent run as being generated', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-10T10:01:00.000Z'));

		const { subtitle } = prepare({
			releaseDate: '2025-04-01',
			startedAt: '2026-10-10T10:00:00.000Z',
			status: 'pending',
			title: 'X',
		});

		expect(subtitle).toBe('2025 · Seiten werden erzeugt');
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

	// WEB-367: the import switches it off for old issues; everything that exists today stays on.
	it('keeps an issue findable by default', () => {
		expect(field('indexable')).toMatchObject({
			group: 'general',
			initialValue: true,
			title: 'In Suchmaschinen auffindbar',
			type: 'boolean',
		});
	});

	// Sanity serves an asset under a content-hash URL that stays live, so switching an issue off
	// after it was public cannot pull files a search engine already has.
	it('tells editors to switch an issue off before it is first published', () => {
		expect(field('indexable')?.description).toContain('vor dem ersten Veröffentlichen');
	});

	it('lets editors write the intro in the general group', () => {
		expect(field('intro')).toMatchObject({ group: 'general' });
		expect(field('intro')?.readOnly).toBeUndefined();
	});
});
