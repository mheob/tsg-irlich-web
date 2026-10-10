import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

// @vitest-environment node
import type { RenderedPage } from '@tsgi-web/pdf-pages';

import type { ArchiveStore } from './archive-store';
import type { IssuePlan } from './manifest';
import { isSuccessful, runImport, summarize } from './run-import';
import type { ImportDependencies } from './run-import';

const PDF_ID = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const SCAN: IssuePlan = {
	documentId: 'echo-archiv-1984-tsg-irlich-1-echo',
	file: '1980-1989/1984 - TSG Irlich - 1.Echo.pdf',
	releaseDate: '1984-03-01',
	slug: 'tsg-echo-1984-nr-1',
	title: 'TSG ECHO 1984 Nr. 1',
};
const DIGITAL: IssuePlan = {
	documentId: 'echo-archiv-2010-02',
	file: '2000-2012/2010_02.pdf',
	releaseDate: '2010-09-20',
	slug: 'tsg-echo-2010-nr-2',
	title: 'TSG ECHO 2010 Nr. 2',
};

/**
 * Renders the given number of pages, with text on every page when `text` is set.
 *
 * @param count - How many pages.
 * @param text - The text of each page.
 * @returns A `renderPages` replacement.
 */
function pages(count: number, text = '') {
	// oxlint-disable-next-line typescript/require-await -- an async generator stands in for the renderer
	return async function* render(): AsyncGenerator<RenderedPage> {
		for (let index = 1; index <= count; index++) {
			yield { height: 2000, index, jpeg: new Uint8Array([index]), text, width: 1414 };
		}
	};
}

/** A store whose every method is a typed spy, so a test can read `.mock.calls`. */
type FakeStore = { [Method in keyof ArchiveStore]: Mock<ArchiveStore[Method]> };

type DraftIntro = NonNullable<ImportDependencies['draftIntro']>;

/** The dependencies with spies where a test looks at the calls. */
interface FakeDeps extends ImportDependencies {
	draftIntro?: Mock<DraftIntro>;
	log: Mock<ImportDependencies['log']>;
	readPdf: Mock<ImportDependencies['readPdf']>;
	store: FakeStore;
}

/**
 * An in-memory store: the release is missing and no issue exists yet, unless told otherwise.
 *
 * @param overrides - Replacements for single methods, each a `vi.fn<ArchiveStore['…']>()`.
 * @returns The store.
 */
function createStore(overrides: Partial<FakeStore> = {}): FakeStore {
	return {
		createRelease: vi.fn<ArchiveStore['createRelease']>().mockResolvedValue(),
		createVersion: vi.fn<ArchiveStore['createVersion']>().mockResolvedValue(),
		findExisting: vi.fn<ArchiveStore['findExisting']>().mockResolvedValue(new Set()),
		findIndexableBefore: vi.fn<ArchiveStore['findIndexableBefore']>().mockResolvedValue([]),
		// oxlint-disable-next-line unicorn/no-useless-undefined -- a missing release reads as `undefined`
		getReleaseState: vi.fn<ArchiveStore['getReleaseState']>().mockResolvedValue(undefined),
		uploadPage: vi
			.fn<ArchiveStore['uploadPage']>()
			.mockResolvedValueOnce('image-1-1414x2000-jpg')
			.mockResolvedValueOnce('image-2-1414x2000-jpg')
			.mockResolvedValue('image-n-1414x2000-jpg'),
		uploadPdf: vi.fn<ArchiveStore['uploadPdf']>().mockResolvedValue(PDF_ID),
		...overrides,
	};
}

/**
 * The dependencies of a run, with a fixed clock and a two-page scan for every PDF.
 *
 * @param overrides - Replacements, for instance another store or `draftIntro`.
 * @returns The dependencies.
 */
function createDeps(overrides: Partial<FakeDeps> = {}): FakeDeps {
	return {
		draftIntro: vi.fn<DraftIntro>().mockResolvedValue('Ein Intro.'),
		log: vi.fn<ImportDependencies['log']>(),
		now: () => new Date('2026-10-11T10:00:00.000Z'),
		readPdf: vi.fn<ImportDependencies['readPdf']>().mockResolvedValue(new Uint8Array([0x25])),
		renderPages: pages(2),
		store: createStore(),
		...overrides,
	};
}

/**
 * A release in the given state.
 *
 * @param state - The release state, e.g. `active`.
 * @returns The `getReleaseState` override.
 */
function releaseIn(state: string): Pick<FakeStore, 'getReleaseState'> {
	return { getReleaseState: vi.fn<ArchiveStore['getReleaseState']>().mockResolvedValue(state) };
}

describe('an import run', () => {
	it('creates the missing release, then one hidden, rendered version per issue', async () => {
		const deps = createDeps();

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createRelease).toHaveBeenCalledOnce();
		expect(deps.store.uploadPdf).toHaveBeenCalledWith(
			new Uint8Array([0x25]),
			'tsg-echo-1984-nr-1.pdf',
		);
		expect(deps.store.uploadPage).toHaveBeenNthCalledWith(
			2,
			new Uint8Array([2]),
			'echo-8c321136-seite-002.jpg',
		);
		expect(deps.store.createVersion).toHaveBeenCalledWith('echo-archiv-1984-tsg-irlich-1-echo', {
			_type: 'echo.issue',
			extractedText: '',
			indexable: false,
			intro: 'Ein Intro.',
			pages: [
				{
					_key: 'seite-1',
					_type: 'image',
					asset: { _ref: 'image-1-1414x2000-jpg', _type: 'reference' },
				},
				{
					_key: 'seite-2',
					_type: 'image',
					asset: { _ref: 'image-2-1414x2000-jpg', _type: 'reference' },
				},
			],
			pdf: { _type: 'file', asset: { _ref: PDF_ID, _type: 'reference' } },
			releaseDate: '1984-03-01',
			render: {
				finishedAt: '2026-10-11T10:00:00.000Z',
				pageCount: 2,
				source: PDF_ID,
				startedAt: '2026-10-11T10:00:00.000Z',
				status: 'done',
			},
			slug: { _type: 'slug', current: 'tsg-echo-1984-nr-1' },
			title: 'TSG ECHO 1984 Nr. 1',
		});
		expect(report.created).toStrictEqual(['echo-archiv-1984-tsg-irlich-1-echo']);
	});

	it('collects the text layer of a digital issue like the render route', async () => {
		const deps = createDeps({ renderPages: pages(2, 'Abteilungen') });

		await runImport([DIGITAL], deps, { dryRun: false });

		expect(deps.store.createVersion.mock.calls[0]?.[1]).toMatchObject({
			extractedText: '--- Seite 1 ---\nAbteilungen\n\n--- Seite 2 ---\nAbteilungen',
		});
	});

	it('shows the intro model the first three pages, the text, the title and the year', async () => {
		const deps = createDeps({ renderPages: pages(5, 'Abteilungen') });

		await runImport([DIGITAL], deps, { dryRun: false });

		expect(deps.draftIntro).toHaveBeenCalledWith({
			images: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
			text: '--- Seite 1 ---\nAbteilungen\n\n--- Seite 2 ---\nAbteilungen\n\n--- Seite 3 ---\nAbteilungen\n\n--- Seite 4 ---\nAbteilungen\n\n--- Seite 5 ---\nAbteilungen',
			title: 'TSG ECHO 2010 Nr. 2',
			year: '2010',
		});
	});

	it('adds to a release that is still open', async () => {
		const deps = createDeps({ store: createStore(releaseIn('active')) });

		await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createRelease).not.toHaveBeenCalled();
		expect(deps.store.createVersion).toHaveBeenCalledOnce();
	});

	// Review focus 4.
	it.each(['published', 'archived', 'scheduled'])(
		'refuses a release that is %s before uploading anything',
		async (state) => {
			const deps = createDeps({ store: createStore(releaseIn(state)) });

			await expect(runImport([SCAN], deps, { dryRun: false })).rejects.toThrow(
				`Der Release „TSG-Echo-Archiv“ ist ${state} und nimmt keine Ausgaben mehr auf.`,
			);
			expect(deps.store.uploadPdf).not.toHaveBeenCalled();
		},
	);

	// Review focus 1: a rerun creates no duplicates.
	it('skips an issue that exists in any form', async () => {
		const existing = new Set([SCAN.documentId]);
		const deps = createDeps({
			store: createStore({
				findExisting: vi.fn<ArchiveStore['findExisting']>().mockResolvedValue(existing),
			}),
		});

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: false });

		expect(deps.store.findExisting).toHaveBeenCalledWith([SCAN.documentId, DIGITAL.documentId]);
		expect(report.skipped).toStrictEqual([SCAN.documentId]);
		expect(report.created).toStrictEqual([DIGITAL.documentId]);
		expect(deps.readPdf).toHaveBeenCalledOnce();
	});

	// Review focus 1: a failure leaves no version behind, so the next run imports the issue again.
	it('records a failing issue and goes on with the next one', async () => {
		const store = createStore({
			createVersion: vi
				.fn<ArchiveStore['createVersion']>()
				.mockRejectedValueOnce(new Error('Netzwerk weg'))
				.mockResolvedValue(),
		});
		const deps = createDeps({ store });

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([{ documentId: SCAN.documentId, error: 'Netzwerk weg' }]);
		expect(report.created).toStrictEqual([DIGITAL.documentId]);
		expect(isSuccessful(report)).toBe(false);
	});

	it('fails an empty pdf without creating a version', async () => {
		const deps = createDeps({ renderPages: pages(0) });

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([
			{ documentId: SCAN.documentId, error: 'Die PDF enthält keine Seiten.' },
		]);
		expect(deps.store.createVersion).not.toHaveBeenCalled();
	});

	// Review focus 5: the import does not stand or fall with the intro.
	it('imports an issue without an intro when drafting fails, and lists it', async () => {
		const deps = createDeps({
			draftIntro: vi
				.fn<DraftIntro>()
				.mockRejectedValue(new Error('Die Anthropic-API antwortete mit 529.')),
		});

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createVersion.mock.calls[0]?.[1]).not.toHaveProperty('intro');
		expect(report.created).toStrictEqual([SCAN.documentId]);
		expect(report.withoutIntro).toStrictEqual([SCAN.documentId]);
		expect(deps.log).toHaveBeenCalledWith('  Kein Intro: Die Anthropic-API antwortete mit 529.');
	});

	it('imports without intros when none are wanted', async () => {
		const deps = createDeps({ draftIntro: undefined });

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(report.withoutIntro).toStrictEqual([SCAN.documentId]);
	});

	it('reports every indexable issue before 2013', async () => {
		const deps = createDeps({
			store: createStore({
				findIndexableBefore: vi
					.fn<ArchiveStore['findIndexableBefore']>()
					.mockResolvedValue(['echo-1984']),
			}),
		});

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.findIndexableBefore).toHaveBeenCalledWith('2013-01-01');
		expect(report.indexableBefore).toStrictEqual(['echo-1984']);
		expect(isSuccessful(report)).toBe(false);
	});
});

describe('a dry run', () => {
	it('writes nothing and drafts no intro', async () => {
		const deps = createDeps({ renderPages: pages(3, 'Text') });

		await runImport([SCAN, DIGITAL], deps, { dryRun: true });

		expect(deps.store.createRelease).not.toHaveBeenCalled();
		expect(deps.store.uploadPdf).not.toHaveBeenCalled();
		expect(deps.store.uploadPage).not.toHaveBeenCalled();
		expect(deps.store.createVersion).not.toHaveBeenCalled();
		expect(deps.draftIntro).not.toHaveBeenCalled();
	});

	it('renders every pdf and reports it as checked', async () => {
		const deps = createDeps({ renderPages: pages(3, 'Text') });

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: true });

		expect(report.checked).toStrictEqual([SCAN.documentId, DIGITAL.documentId]);
		expect(deps.log).toHaveBeenCalledWith('  3 Seiten, mit Textebene');
		expect(isSuccessful(report)).toBe(true);
	});

	it('says that a scan has no text layer', async () => {
		const deps = createDeps();

		await runImport([SCAN], deps, { dryRun: true });

		expect(deps.log).toHaveBeenCalledWith('  2 Seiten, Scan ohne Textebene');
	});

	it('still refuses a published release', async () => {
		const deps = createDeps({ store: createStore(releaseIn('published')) });

		await expect(runImport([SCAN], deps, { dryRun: true })).rejects.toThrow(
			'nimmt keine Ausgaben mehr auf',
		);
	});
});

describe('the summary', () => {
	it('counts every outcome and names what needs attention', () => {
		const lines = summarize(
			{
				checked: [],
				created: ['a', 'b'],
				failed: [{ documentId: 'c', error: 'kaputt' }],
				indexableBefore: ['d'],
				skipped: ['e'],
				withoutIntro: ['b'],
			},
			false,
		);

		expect(lines).toStrictEqual([
			'Angelegt: 2, übersprungen: 1, fehlgeschlagen: 1',
			'Fehlgeschlagen: c (kaputt)',
			'Ohne Intro: b',
			'Auffindbar trotz Erscheinen vor 2013: d',
		]);
	});

	it('reports a clean dry run in one line', () => {
		const lines = summarize(
			{
				checked: ['a'],
				created: [],
				failed: [],
				indexableBefore: [],
				skipped: [],
				withoutIntro: [],
			},
			true,
		);

		expect(lines).toStrictEqual(['Probelauf: 1 geprüft, übersprungen: 0, fehlgeschlagen: 0']);
	});
});
