import type { IssuePlan } from './manifest';

/** The release a run fills unless `--release` names another one. */
const DEFAULT_RELEASE_ID = 'tsg-echo-archiv';
const RELEASE_TITLE = 'TSG-Echo-Archiv';
const RELEASE_DESCRIPTION =
	'Die alten Ausgaben 1979–2012 aus dem Import (WEB-354). Intros prüfen, dann den Release veröffentlichen.';
/** Every issue from before this date is the old archive and must never be indexable. */
const ARCHIVE_CUTOFF = '2013-01-01';

// No named group: the studio's tsconfig targets ES2017.
const PDF_ASSET_ID = /^file-[0-9a-f]{40}-pdf$/u;
const FILE_PREFIX = 'file-';
const PAGE_NUMBER_DIGITS = 3;
const SHORT_HASH_LENGTH = 8;

/**
 * The file name of an uploaded page, the same scheme as the render route's.
 *
 * @param pdfAssetId - The `_id` of the uploaded PDF, `file-<sha1>-pdf`.
 * @param index - The 1-based page number.
 * @returns The name, e.g. `echo-8c321136-seite-007.jpg`.
 * @throws {Error} For an id that is not a PDF asset.
 */
function toPageFilename(pdfAssetId: string, index: number): string {
	if (!PDF_ASSET_ID.test(pdfAssetId)) {
		throw new Error(`Ungültige PDF-Asset-ID ${pdfAssetId}`);
	}
	const hash = pdfAssetId.slice(FILE_PREFIX.length, FILE_PREFIX.length + SHORT_HASH_LENGTH);
	const number = String(index).padStart(PAGE_NUMBER_DIGITS, '0');
	return `echo-${hash}-seite-${number}.jpg`;
}

/**
 * The entry of the `pages` array that references an uploaded page.
 *
 * @param assetId - The `_id` of the uploaded image.
 * @param index - The 1-based page number.
 * @returns The array item.
 */
function toPageEntry(assetId: string, index: number): EchoPage {
	return {
		_key: `seite-${index}`,
		_type: 'image',
		asset: { _ref: assetId, _type: 'reference' },
	};
}

/**
 * The block a page adds to `extractedText`, the same as the render route's.
 *
 * @param page - The page number and its text layer.
 * @returns The block, or `undefined` for a page without text.
 */
function toPageText(page: { index: number; text: string }): string | undefined {
	return page.text ? `--- Seite ${page.index} ---\n${page.text}` : undefined;
}

/**
 * The `echo.issue` an archive entry becomes. It is hidden from search engines (WEB-367), and its
 * `render.source` already names its PDF, so the render webhook's filter never picks it up.
 *
 * @param plan - The manifest entry.
 * @param content - What the run uploaded and rendered.
 * @returns The document, without `_id`: the release version derives it.
 */
function buildIssueDocument(plan: IssuePlan, content: IssueContent): EchoIssueDocument {
	return {
		_type: 'echo.issue',
		extractedText: content.extractedText,
		indexable: false,
		...(content.intro ? { intro: content.intro } : {}),
		pages: content.pages,
		pdf: { _type: 'file', asset: { _ref: content.pdfAssetId, _type: 'reference' } },
		releaseDate: plan.releaseDate,
		render: {
			finishedAt: content.finishedAt,
			pageCount: content.pages.length,
			source: content.pdfAssetId,
			startedAt: content.startedAt,
			status: 'done',
		},
		slug: { _type: 'slug', current: plan.slug },
		title: plan.title,
	};
}

interface EchoPage {
	_key: string;
	_type: 'image';
	asset: { _ref: string; _type: 'reference' };
}

interface IssueContent {
	extractedText: string;
	finishedAt: string;
	intro: string | undefined;
	pages: EchoPage[];
	pdfAssetId: string;
	startedAt: string;
}

interface EchoIssueDocument {
	_type: 'echo.issue';
	extractedText: string;
	indexable: false;
	intro?: string;
	pages: EchoPage[];
	pdf: { _type: 'file'; asset: { _ref: string; _type: 'reference' } };
	releaseDate: string;
	render: {
		finishedAt: string;
		pageCount: number;
		source: string;
		startedAt: string;
		status: 'done';
	};
	slug: { _type: 'slug'; current: string };
	title: string;
}

export {
	ARCHIVE_CUTOFF,
	RELEASE_DESCRIPTION,
	DEFAULT_RELEASE_ID,
	RELEASE_TITLE,
	buildIssueDocument,
	toPageEntry,
	toPageFilename,
	toPageText,
};
export type { EchoIssueDocument, EchoPage, IssueContent };
