import type { Metadata } from 'next';

import { ECHO_OVERVIEW_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';
import { getPaginatedPath } from '@/utils/pagination';

import { getArchiveHeroImage, getArchivePage } from './archive-data';

/**
 * Builds the metadata of a page of the TSG-Echo archive. `/verein/echo` is the first page, and
 * `/verein/echo/seite/[page]` serves the later ones, which are addressed as `/verein/echo?seite=N`.
 *
 * @param currentPage - The page shown, from 1.
 * @returns The metadata, empty without the archive document.
 */
async function getEchoArchiveMetadata(currentPage: number): Promise<Metadata> {
	const [page, heroImage] = await Promise.all([getArchivePage(), getArchiveHeroImage()]);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: heroImage,
		meta: page.meta,
		pageNumber: currentPage,
		path: getPaginatedPath(ECHO_OVERVIEW_PATH, currentPage),
		title: page.title,
	});
}

export { getEchoArchiveMetadata };
