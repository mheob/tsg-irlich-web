import { describe, expect, it } from 'vite-plus/test';

import robots from '@/app/robots';

describe('robots.txt', () => {
	it('lets every crawler in', () => {
		expect(robots().rules).toContainEqual({ allow: '/', userAgent: '*' });
	});

	// WEB-367: AI crawlers document robots.txt as their opt-out, not noindex, and the files of old
	// TSG-Echo issues carry phone numbers and addresses. Search engines still reach the path through
	// `*`, so they see its X-Robots-Tag instead of indexing the bare URL.
	it('keeps the named AI crawlers away from the echo archive files only', () => {
		expect(robots().rules).toContainEqual({
			allow: '/',
			disallow: '/echo-archiv/',
			userAgent: [
				'GPTBot',
				'OAI-SearchBot',
				'ChatGPT-User',
				'ClaudeBot',
				'Claude-SearchBot',
				'Claude-User',
				'PerplexityBot',
				'Perplexity-User',
				'Google-Extended',
				'Applebot-Extended',
				'CCBot',
			],
		});
	});

	it('points at the sitemap of the site', () => {
		expect(robots()).toMatchObject({
			host: 'http://localhost:3000',
			sitemap: 'http://localhost:3000/sitemap.xml',
		});
	});
});
