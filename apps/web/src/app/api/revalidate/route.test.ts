import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

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

	it('tags every revalidation with the document type', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'testimonial' }));

		await POST(REQUEST);

		expect(mockedRevalidateTag).toHaveBeenCalledWith('testimonial', 'max');
	});

	it.each([
		['aboutUs', ['/verein']],
		['contact', ['/kontakt']],
		['departmentsPage', ['/angebot']],
		['home', ['/']],
		['imprint', ['/impressum']],
		['membership', ['/mitgliedschaft']],
		['newsOverview', ['/news']],
		['privacy', ['/datenschutz']],
		['testimonial', ['/']],
	])('revalidates %s at %j', async (type, expected) => {
		mockedParseBody.mockResolvedValue(parsed({ _type: type }));

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual(expected);
	});

	it.each([
		['navigation', '/'],
		['settings', '/'],
	])('revalidates the whole layout for %s', async (type, path) => {
		mockedParseBody.mockResolvedValue(parsed({ _type: type }));

		await POST(REQUEST);

		expect(mockedRevalidatePath).toHaveBeenCalledWith(path, 'layout');
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
	});

	it('revalidates the group department, its overview and the group itself', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'group.soccer', slug: { current: 'herren-1' } }),
		);

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual([
			'/angebot',
			'/angebot/fussball',
			'/angebot/fussball/herren-1',
		]);
	});

	it('leaves out the group path when the payload carries no slug', async () => {
		mockedParseBody.mockResolvedValue(parsed({ _type: 'group.taekwondo' }));

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual(['/angebot', '/angebot/taekwondo']);
	});

	it('revalidates the article route for a news article', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'news.article', slug: { current: 'sommerfest' } }),
		);

		await POST(REQUEST);

		// The article's category is no part of the payload, so its own URL cannot be built and the
		// whole route is revalidated instead.
		expect(revalidatedPaths()).toStrictEqual(['/news', '/news/[category]/[slug]']);
		expect(mockedRevalidatePath).toHaveBeenCalledWith('/news/[category]/[slug]', 'page');
	});

	it('adds the category page for a news category', async () => {
		mockedParseBody.mockResolvedValue(
			parsed({ _type: 'news.category', slug: { current: 'vereinsleben' } }),
		);

		await POST(REQUEST);

		expect(revalidatedPaths()).toStrictEqual([
			'/news',
			'/news/[category]/[slug]',
			'/news/vereinsleben',
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
		expect(mockedRevalidateTag).toHaveBeenCalledWith('somethingNew', 'max');
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
