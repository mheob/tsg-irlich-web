import { setTimeout as sleep } from 'node:timers/promises';

import { parseBody } from 'next-sanity/webhook';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { settle } from '@tsgi-web/shared';

import { FILE_ASSET_REF } from '@/lib/echo/asset-url';
import { downloadPdf } from '@/lib/echo/download-pdf';
import { renderPdfPagesWithData } from '@/lib/echo/pdfjs-data';
import { claimRender, runRender } from '@/lib/echo/render-issue';
import type { ClaimOutcome, RenderJob } from '@/lib/echo/render-issue';
import { createRenderStore } from '@/lib/echo/render-store';
import type { EchoRenderStore } from '@/lib/echo/render-store';
import { env } from '@/lib/env';
import { dataset, projectId } from '@/lib/sanity/api';
import { getWriteClient } from '@/lib/sanity/write-client';

const payloadSchema = z.object({
	_id: z.string().min(1),
	pdfRef: z.string().regex(FILE_ASSET_REF),
});

// 409 makes Sanity retry the delivery, which then sees `duplicate`. Every other non-claim has
// nothing left to do, so it must not be retried.
const STATUS_CODES: Record<ClaimOutcome['status'], number> = {
	claimed: 202,
	conflict: 409,
	duplicate: 200,
	missing: 200,
	stale: 200,
};

/**
 * Renders a claimed document once the response has been sent, and logs how the run ended. A run
 * that throws could not even record its failure, so the log is the only trace of it.
 *
 * @param job - The claimed job.
 * @param store - The store the claim went through.
 */
function scheduleRender(job: RenderJob, store: EchoRenderStore): void {
	after(async () => {
		const outcome = await settle(
			runRender(job, {
				downloadPdf,
				location: { dataset, projectId },
				now: Date.now,
				renderPages: renderPdfPagesWithData,
				store,
				wait: sleep,
			}),
		);
		if (outcome.ok) {
			console.info(`[echo/render] ${job.id}: ${outcome.value}`);
		} else {
			console.error(`[echo/render] ${job.id}: error`, outcome.error);
		}
	});
}

/**
 * Claims the document and, if the claim went through, schedules the render.
 *
 * @param payload - The validated webhook payload.
 * @returns The claim outcome.
 */
async function claimAndSchedule(payload: z.infer<typeof payloadSchema>): Promise<ClaimOutcome> {
	const store = createRenderStore(getWriteClient());
	const claim = await claimRender(
		store,
		{ id: payload._id, pdfRef: payload.pdfRef },
		new Date().toISOString(),
	);
	if (claim.status === 'claimed') {
		scheduleRender(claim.job, store);
	}
	return claim;
}

// Rendering runs after the response. Vercel Pro allows 800 s; the spike rendered 52 pages in 23 s.
export const maxDuration = 800;

/**
 * Receives the TSG-Echo webhook, claims the document and renders its PDF after the response.
 *
 * @param request - The signed webhook request.
 * @returns The claim outcome.
 */
export async function POST(request: NextRequest): Promise<Response> {
	const { body, isValidSignature } = await parseBody<unknown>(
		request,
		env('SANITY_ECHO_RENDER_SECRET'),
	);
	if (!isValidSignature) {
		return Response.json({ message: 'Invalid signature' }, { status: 401 });
	}

	const payload = payloadSchema.safeParse(body);
	if (!payload.success) {
		return Response.json({ message: 'Bad Request' }, { status: 400 });
	}

	const claim = await claimAndSchedule(payload.data);
	return Response.json({ status: claim.status }, { status: STATUS_CODES[claim.status] });
}
