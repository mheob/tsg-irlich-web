import { describe, expect, it } from 'vite-plus/test';

import { finishedEchoIssue } from '@/lib/sanity/queries';
import { sitemapEchoIssuesQuery } from '@/lib/sanity/queries/sitemap';

import { echoIssueQuery, echoIssueSlugsQuery, echoIssuesQuery, echoIssuesTotalQuery } from './echo';

describe('tsg-echo queries', () => {
	// Review focus 2: a pending or failed issue, whose pages may still belong to the previous PDF,
	// must not reach any list, page or sitemap.
	it('only shows issues whose pages are rendered', () => {
		expect(finishedEchoIssue).toContain("render.status == 'done'");
	});

	it.each([
		['the total', echoIssuesTotalQuery],
		['the list', echoIssuesQuery],
		['the issue page', echoIssueQuery],
		['the static params', echoIssueSlugsQuery],
		['the sitemap', sitemapEchoIssuesQuery],
	])('filters %s through the shared rule', (_label, query) => {
		expect(query).toContain(finishedEchoIssue);
	});
});
