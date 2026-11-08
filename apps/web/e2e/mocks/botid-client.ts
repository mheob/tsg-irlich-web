/**
 * Stands in for `botid/client/core` in the e2e build (`turbopack.resolveAlias` in `next.config.ts`).
 *
 * The real `initBotId()` loads Vercel's challenge script through the rewrites `withBotId` adds and
 * attaches its headers to every protected request. The e2e build has neither the rewrites nor the
 * platform behind them, and the server side is stubbed as well (`botid-server.ts`), so the client
 * has nothing to do.
 */
import type { initBotId as realInitBotId } from 'botid/client/core';

export const initBotId: typeof realInitBotId = () => {
	// Nothing to set up without Vercel.
};
