/**
 * Stands in for `botid/server` in the e2e build (`turbopack.resolveAlias` in `next.config.ts`).
 *
 * The real `checkBotId()` only works on Vercel: under `next start` elsewhere it asks for an OIDC
 * token, calls `api.vercel.com` and then throws, because it cannot reach the platform's response
 * headers. The MSW preload cannot replace a module inside the Turbopack bundle, so the build itself
 * swaps the package for this file. Every visitor of the suite is human.
 */
import type { checkBotId as realCheckBotId } from 'botid/server';

// oxlint-disable-next-line typescript/require-await -- the real function is async
export const checkBotId: typeof realCheckBotId = async () => ({
	bypassed: true,
	isBot: false,
	isHuman: true,
	isVerifiedBot: false,
});
