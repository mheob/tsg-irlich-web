import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { renderPdfPages } from '@tsgi-web/pdf-pages';

import { POST } from '@/app/api/echo/render/route';
import { claimRender, runRender } from '@/lib/echo/render-issue';

// The signature check belongs to next-sanity; mocking it makes "is the signature valid" an input.
vi.mock(import('next-sanity/webhook'), () => ({ parseBody: vi.fn() }));
// `after` only exists inside a Next.js request; the test collects the callback and runs it.
vi.mock(import('next/server'), async (importOriginal) => ({
	...(await importOriginal()),
	after: vi.fn<typeof after>(),
}));
// The orchestration has its own tests; here it only matters what the route hands it.
vi.mock(import('@/lib/echo/render-issue'), () => ({ claimRender: vi.fn(), runRender: vi.fn() }));
vi.mock(import('@/lib/sanity/write-client'), () => ({ getWriteClient: vi.fn() }));
// `api.ts` reads the project and the dataset at import time, before any `beforeAll` could stub them.
vi.mock(import('@/lib/sanity/api'), () => ({
	apiVersion: '2025-12-15',
	dataset: 'development',
	projectId: 'j4rxwl5m',
	studioUrl: undefined,
}));
// Keeps the native canvas binding out of this test.
vi.mock(import('@tsgi-web/pdf-pages'), () => ({ renderPdfPages: vi.fn() }));

const mockedParseBody = vi.mocked(parseBody);
const mockedAfter = vi.mocked(after);
const mockedClaim = vi.mocked(claimRender);
const mockedRun = vi.mocked(runRender);

const REQUEST = {} as NextRequest;
const PDF_REF = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const JOB = { id: 'drafts.echo-2025', pdfRef: PDF_REF, startedAt: '2026-10-10T10:00:00.000Z' };

function signed(body: unknown, isValidSignature = true): ParsedBody<unknown> {
	return { body, isValidSignature };
}

describe('echo render webhook', () => {
	beforeAll(() => {
		// `env()` reads lazily, at the first request, so stubbing here is early enough.
		vi.stubEnv('SANITY_ECHO_RENDER_SECRET', 'test-secret');
	});

	afterEach(() => {
		mockedParseBody.mockReset();
		mockedAfter.mockReset();
		mockedClaim.mockReset();
		mockedRun.mockReset();
	});

	it('rejects a payload whose signature does not match', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }, false));

		const response = await POST(REQUEST);

		expect(response.status).toBe(401);
		expect(mockedClaim).not.toHaveBeenCalled();
	});

	it('verifies the signature with the render secret', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }, false));

		await POST(REQUEST);

		expect(mockedParseBody).toHaveBeenCalledWith(REQUEST, 'test-secret');
	});

	it.each([
		['no body', null],
		['a missing id', { pdfRef: PDF_REF }],
		['an image reference', { _id: JOB.id, pdfRef: 'image-abc-2000x1414-jpg' }],
		['a url instead of a reference', { _id: JOB.id, pdfRef: 'https://evil.example/x.pdf' }],
	])('rejects %s with 400 before touching Sanity', async (_label, body) => {
		mockedParseBody.mockResolvedValue(signed(body));

		const response = await POST(REQUEST);

		expect(response.status).toBe(400);
		expect(mockedClaim).not.toHaveBeenCalled();
	});

	it('answers 202 and renders after the response for a claimed document', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
		mockedClaim.mockResolvedValue({ job: JOB, status: 'claimed' });
		mockedRun.mockResolvedValue('done');

		const response = await POST(REQUEST);

		expect(response.status).toBe(202);
		expect(mockedClaim).toHaveBeenCalledWith(
			expect.anything(),
			{ id: JOB.id, pdfRef: PDF_REF },
			expect.any(String),
		);
		expect(mockedRun).not.toHaveBeenCalled();

		const task = mockedAfter.mock.calls.at(0)?.at(0);
		await (task as () => Promise<void>)();

		expect(mockedRun).toHaveBeenCalledWith(
			JOB,
			expect.objectContaining({
				location: { dataset: 'development', projectId: 'j4rxwl5m' },
				renderPages: renderPdfPages,
			}),
		);
	});

	it('answers 409 to a delivery that lost the race, so Sanity retries it', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
		mockedClaim.mockResolvedValue({ status: 'conflict' });

		const response = await POST(REQUEST);

		expect(response.status).toBe(409);
		expect(mockedAfter).not.toHaveBeenCalled();
	});

	it.each(['duplicate', 'stale', 'missing'] as const)(
		'answers 200 without a run for %s',
		async (status) => {
			mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
			mockedClaim.mockResolvedValue({ status });

			const response = await POST(REQUEST);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toStrictEqual({ status });
			expect(mockedAfter).not.toHaveBeenCalled();
		},
	);
});
