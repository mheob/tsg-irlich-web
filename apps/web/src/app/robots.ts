import type { MetadataRoute } from 'next';

import { ARCHIVE_PATH } from '@/lib/echo/archive-url';
import { getBaseUrl } from '@/utils/url';

/**
 * The AI crawlers the club lets in on purpose, checked against each vendor's documentation.
 *
 * Every page is public club information, and the goal is to show up as a source when someone asks
 * an AI assistant about the club. So search, training and user-triggered fetchers are all allowed:
 *
 * - OpenAI: `GPTBot` (training), `OAI-SearchBot` (ChatGPT search), `ChatGPT-User` (user requests)
 * - Anthropic: `ClaudeBot` (training), `Claude-SearchBot` (search), `Claude-User` (user requests)
 * - Perplexity: `PerplexityBot` (search), `Perplexity-User` (user requests; Perplexity says it
 *   generally ignores robots.txt, it is listed for completeness)
 * - Google: `Google-Extended` (Gemini training and grounding; Google Search is unaffected)
 * - Apple: `Applebot-Extended` (training of Apple's foundation models; it does not crawl itself)
 * - Common Crawl: `CCBot` (the open web corpus many models are trained on)
 *
 * They have a group of their own for one exception: the files of old TSG-Echo issues below
 * `/echo-archiv/` (WEB-367), which carry phone numbers, addresses and photos of children. Search
 * engines get that path through `*` and its `X-Robots-Tag: noindex`; AI crawlers document
 * robots.txt as their opt-out instead. A crawler with a group of its own ignores the `*` group, so
 * a `disallow` added to `*` later has to be added to this group as well.
 */
const AI_CRAWLERS = [
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
];

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getBaseUrl();

	return {
		host: baseUrl,
		rules: [
			{ allow: '/', userAgent: '*' },
			{ allow: '/', disallow: `${ARCHIVE_PATH}/`, userAgent: AI_CRAWLERS },
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
