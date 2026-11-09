import { glob } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initBotId } from 'botid/client/core';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock(import('botid/client/core'), () => ({ initBotId: vi.fn<typeof initBotId>() }));

type ProtectedRoute = Parameters<typeof initBotId>[0]['protect'][number];

/**
 * The pages that render no form. Every other page counts as one a server action may be posted
 * from, so a new page fails the guard below until it is protected or added here.
 */
const PAGES_WITHOUT_FORM = ['/barrierefreiheit', '/datenschutz', '/impressum'];

/** Addresses the browser posts to that are no page and need no BotID headers. */
const NO_PAGES = ['/api/search', '/_vercel/insights/view', '/_vercel/speed-insights/vitals'];

/**
 * The routes `instrumentation-client.ts` hands to `initBotId`. The module is loaded afresh, since
 * the calls of the mock are cleared between the cases.
 *
 * @returns The `protect` list of its one call.
 */
async function getProtectedRoutes(): Promise<ProtectedRoute[]> {
	vi.resetModules();
	await import('./instrumentation-client');
	const { lastCall } = vi.mocked(initBotId).mock;
	if (!lastCall) {
		throw new Error('initBotId was not called');
	}
	return lastCall[0].protect;
}

/**
 * One address per page of the app: route groups dropped, a dynamic segment filled with a sample.
 *
 * @returns The addresses, `/` for the home page.
 */
async function getPageAddresses(): Promise<string[]> {
	const appDirectory = fileURLToPath(new URL('app', import.meta.url));
	const pageFiles = await Array.fromAsync(glob('**/page.tsx', { cwd: appDirectory }));
	return pageFiles.map((file) => {
		const segments = path
			.dirname(file)
			.split(path.sep)
			.filter((segment) => segment !== '.' && !segment.startsWith('('))
			.map((segment) => (segment.startsWith('[') ? 'beispiel' : segment));
		return `/${segments.join('/')}`;
	});
}

/**
 * Whether BotID attaches its headers to a POST to the address. Mirrors the matching of
 * `botid/client/core` (1.5): `*` stands for any run of characters, slashes included, and the
 * pattern has to cover the whole path.
 *
 * @param routes - The `protect` list.
 * @param address - The path a server action is posted to, the one of its page.
 * @returns `true` when a route covers it.
 */
function isProtected(routes: ProtectedRoute[], address: string): boolean {
	return routes.some(({ method, path: pattern }) => {
		const source = pattern
			.split('*')
			.map((part) => part.replaceAll(/[$()+.?[\\\]^{|}]/gu, String.raw`\$&`))
			.join('.*');
		const isPost = method === '*' || method.toUpperCase() === 'POST';
		return isPost && new RegExp(`^${source}$`, 'u').test(address);
	});
}

describe('protecting the forms with BotID', () => {
	it('covers every page a form posts its server action from', async () => {
		const routes = await getProtectedRoutes();
		const addresses = await getPageAddresses();

		expect(addresses).toContain('/');
		expect(addresses).toStrictEqual(expect.arrayContaining(PAGES_WITHOUT_FORM));
		expect(
			addresses
				.filter((address) => !PAGES_WITHOUT_FORM.includes(address))
				.filter((address) => !isProtected(routes, address)),
		).toStrictEqual([]);
	});

	it('leaves out the route handlers and the beacons of Vercel', async () => {
		const routes = await getProtectedRoutes();

		expect(NO_PAGES.filter((address) => isProtected(routes, address))).toStrictEqual([]);
	});
});
