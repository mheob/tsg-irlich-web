import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { POST } from '@/app/api/revalidate/route';

// The route only ever hands the request and the secret to `parseBody`, so the signature check
// itself belongs to `next-sanity` — mocking it turns "is the signature valid" into an input of
// the test instead of something that would need a real HMAC over a real body.
vi.mock(import('next-sanity/webhook'), () => ({ parseBody: vi.fn() }));

// Both are `next/cache` server-only bindings; the paths and tags handed to them are the entire
// observable output of the handler.
vi.mock(import('next/cache'), () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const mockedParseBody = vi.mocked(parseBody);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedRevalidateTag = vi.mocked(revalidateTag);

interface WebhookBody {
	_type: string;
	slug?: { current: string };
}

// The handler never touches the request itself — it is passed straight through to `parseBody`.
const REQUEST = {} as NextRequest;

function parsed(
	body: WebhookBody | null,
	isValidSignature: boolean | null = true,
): ParsedBody<WebhookBody> {
	return { body, isValidSignature };
}

function revalidatedPaths(): string[] {
	return mockedRevalidatePath.mock.calls.map(([path]) => path);
}

describe('sanity revalidation webhook', () => {
	beforeAll(() => {
		vi.stubEnv('SANITY_REVALIDATE_SECRET', 'test-secret');
	});

	afterEach(() => {
		mockedParseBody.mockReset();
		mockedRevalidatePath.mockReset();
		mockedRevalidateTag.mockReset();
	});

	it('rejects a payload whose signature does not match', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'home' }, false));

		const response = await POST(REQUEST);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({ message: 'Invalid signature' });
		expect(mockedRevalidatePath).not.toHaveBeenCalled();
		expect(mockedRevalidateTag).not.toHaveBeenCalled();
	});

	it('rejects a valid signature over a body without a document type', async () => {
		mockedParseBody.mockResolvedValue(parsed(null));

		const response = await POST(REQUEST);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ message: 'Bad Request' });
		expect(mockedRevalidatePath).not.toHaveBeenCalled();
	});

	it('answers a revalidated payload with the body it acted on', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'home' }));

		const response = await POST(REQUEST);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			body: { _type: 'home' },
			revalidated: true,
		});
	});

	// WEB-373: with the `max` profile the first render after the webhook was still served the old
	// data (stale-while-revalidate), and Vercel kept that render as the page. A menu change on
	// staging only showed up after the next change. The webhook has to expire the tag at once.
	it('expires the document type tag immediately', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'testimonial' }));

		await POST(REQUEST);

		expect(mockedRevalidateTag.mock.calls).toStrictEqual([['testimonial', { expire: 0 }]]);
	});

	it.each([
		['accessibility', ['/barrierefreiheit']],
		['departmentsPage', ['/angebot']],
		['echoOverview', ['/verein/echo']],
		['home', ['/']],
		['imprint', ['/impressum']],
		['membership', ['/mitgliedschaft']],
		['privacy', ['/datenschutz']],
		['testimonial', ['/']],
	])('revalidates %s at %j', async (type, expected) => {
		mockedParseBody.mockResolvedValue(parsed({ _type: type }));

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual(expected);
	});

	it('revalidates the archive and every issue page for a tsg-echo issue', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'echo.issue', slug: { current: 'tsg-echo-2025' } }),
		);

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([
			['/verein/echo'],
			['/verein/echo/[slug]', 'page'],
		]);
	});

	it('revalidates the categories and the tsg-echo pages along with the news overview, which show its hero and its contact persons', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'newsOverview' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([
			['/news'],
			['/news/[category]', 'page'],
			['/verein/echo'],
			['/verein/echo/[slug]', 'page'],
		]);
	});

	// The feedback page below it shows the hero image of the contact page.
	it('revalidates the contact page with the feedback page below it', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'contact' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/kontakt', 'layout']]);
	});

	// The tsg-echo pages below it show the hero image of the about page.
	it('revalidates the about page with the tsg-echo pages below it', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'aboutUs' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/verein', 'layout']]);
	});

	// WEB-370: the menu and the footer data live in `site-settings`, and the root layout renders them
	// on every page. The handler used to be keyed `navigation` and `settings`, which no document is
	// called, so a menu change only reached the home page.
	it('revalidates the whole layout for the site settings', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'site-settings' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/', 'layout']]);
		expect(mockedRevalidateTag).toHaveBeenCalledWith('site-settings', { expire: 0 });
	});

	// The root layout fetches the placeholder of the search panel with the tag `searchPage`, and the
	// navigation sits on every page. The tag itself expires through `revalidateTag(body._type)`.
	it('revalidates the whole layout for the search page, whose placeholder the navigation shows', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'searchPage' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/', 'layout']]);
		expect(mockedRevalidateTag).toHaveBeenCalledWith('searchPage', { expire: 0 });
	});

	it('revalidates every page a person appears on', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'person' }));

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual([
			'/',
			'/angebot',
			'/kontakt',
			'/news',
			'/mitgliedschaft',
			'/verein',
		]);
		expect(mockedRevalidatePath).toHaveBeenCalledWith('/angebot', 'layout');
		// The about page and the tsg-echo pages below it.
		expect(mockedRevalidatePath).toHaveBeenCalledWith('/verein', 'layout');
	});

	it('revalidates the home page and the whole offer for a department', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'department', slug: { current: 'tanzen' } }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([
			['/'],
			['/angebot', 'layout'],
			['/sitemap.xml'],
			['/llms.txt'],
		]);
	});

	it('revalidates the whole offer for a group, but not the home page', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'group', slug: { current: 'herren' } }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([
			['/angebot', 'layout'],
			['/sitemap.xml'],
			['/llms.txt'],
		]);
		expect(revalidatedPaths()).not.toContain('/');
	});

	it('revalidates every department page for a FAQ', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'faq' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/angebot/[group]', 'page']]);
	});

	it('revalidates every department page for the groups page', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'groupsPage' }));

		await POST(REQUEST);

		expect(mockedRevalidatePath.mock.calls).toStrictEqual([['/angebot/[group]', 'page']]);
	});

	it('revalidates the article route for a news article', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'news.article', slug: { current: 'sommerfest' } }),
		);

		await POST(REQUEST);

		// The article's category is no part of the payload, so its own URL cannot be built and the
		// whole route is revalidated instead.
		expect(revalidatedPaths()).toStrictEqual([
			'/news',
			'/news/[category]',
			'/news/[category]/[slug]',
			'/angebot/[group]/[singleGroup]',
		]);
		expect(mockedRevalidatePath).toHaveBeenCalledWith('/news/[category]/[slug]', 'page');
	});

	it.each(['news.article', 'news.category'])(
		'revalidates every group page for a %s, since each one shows the news of its category',
		async (type) => {
			mockedParseBody.mockResolvedValue(parsed({ _type: type, slug: { current: 'senioren' } }));

			await POST(REQUEST);

			expect(mockedRevalidatePath).toHaveBeenCalledWith('/angebot/[group]/[singleGroup]', 'page');
		},
	);

	it.each(['news.article', 'news.category'])(
		'revalidates every category page for a %s, since each one lists all categories and their counts',
		async (type) => {
			mockedParseBody.mockResolvedValue(parsed({ _type: type, slug: { current: 'senioren' } }));

			await POST(REQUEST);

			expect(mockedRevalidatePath).toHaveBeenCalledWith('/news/[category]', 'page');
		},
	);

	it('revalidates the news routes for a news category', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'news.category', slug: { current: 'vereinsleben' } }),
		);

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual([
			'/news',
			'/news/[category]',
			'/news/[category]/[slug]',
			'/angebot/[group]/[singleGroup]',
		]);
	});

	it('revalidates the group pages a venue is referenced from', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'venue', slug: { current: 'turnhalle' } }));

		// The venue slug is no part of any URL, so it must not end up in a revalidated path.
		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual(['/angebot', '/angebot/[group]/[singleGroup]']);
	});

	it('falls back to the home page for an unknown document type', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'somethingNew' }));

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual(['/']);
		expect(mockedRevalidateTag).toHaveBeenCalledWith('somethingNew', { expire: 0 });
	});

	it('answers a parse failure with its message', async () => {
		const failure = new Error('Invalid body');
		const consoleError = vi.spyOn(console, 'error').mockReturnValue();
		mockedParseBody.mockRejectedValue(failure);

		const response = await POST(REQUEST);

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toStrictEqual({ message: 'Invalid body' });
		expect(consoleError).toHaveBeenCalledWith(failure);
		consoleError.mockRestore();
	});

	it('answers a non-error rejection with a generic message', async () => {
		const consoleError = vi.spyOn(console, 'error').mockReturnValue();
		mockedParseBody.mockRejectedValue('boom');

		const response = await POST(REQUEST);

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toStrictEqual({ message: 'Internal Server Error' });
		consoleError.mockRestore();
	});
});
