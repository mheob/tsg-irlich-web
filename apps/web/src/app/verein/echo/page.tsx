import type { Metadata } from 'next';

import { EchoArchive } from './_shared/echo-archive';
import { getEchoArchiveMetadata } from './_shared/echo-archive-metadata';

/*
 * The first page of the archive. It reads no search parameters, so it is cached; `next.config.ts`
 * rewrites `/verein/echo?seite=N` to `seite/[page]`, which serves the later pages.
 */

export async function generateMetadata(): Promise<Metadata> {
	return getEchoArchiveMetadata(1);
}

export default function EchoArchivePage() {
	return <EchoArchive currentPage={1} />;
}
