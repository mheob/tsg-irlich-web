import { checkBotId } from 'botid/server';

/**
 * Asks BotID whether the current request comes from a bot. Only a request to a page that
 * `initBotId` in `src/instrumentation-client.ts` protects carries the headers BotID needs; on Vercel
 * any other request counts as a bot.
 *
 * @returns `true` for a bot.
 */
export async function isBotRequest(): Promise<boolean> {
	const verification = await checkBotId();
	return verification.isBot;
}

/**
 * Throws for a bot. next-safe-action answers the thrown error with its generic server error, so
 * the bot learns nothing about the reason.
 */
export async function assertHuman(): Promise<void> {
	if (await isBotRequest()) {
		throw new Error('Bot detected');
	}
}
