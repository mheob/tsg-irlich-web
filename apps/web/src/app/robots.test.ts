import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';

describe('robots.txt', () => {
	it('lets every crawler in, the AI crawlers named in the same group', () => {
		expect(robots().rules).toStrictEqual([
			{
				allow: '/',
				userAgent: [
					'*',
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
			},
		]);
	});

	it('points at the sitemap of the site', () => {
		expect(robots()).toMatchObject({
			host: 'http://localhost:3000',
			sitemap: 'http://localhost:3000/sitemap.xml',
		});
	});
});
