import type { checkBotId } from 'botid/server';

type BotIdVerdict = Awaited<ReturnType<typeof checkBotId>>;

/**
 * What `checkBotId()` answers for a visitor. An action test mocks `botid/server` with this as the
 * default, since every action asks BotID before it does anything:
 *
 * ```ts
 * vi.mock(import('botid/server'), async () => {
 * 	const { HUMAN_VERDICT } = await import('../../test-utils/botid');
 * 	return { checkBotId: vi.fn<typeof checkBotId>().mockResolvedValue(HUMAN_VERDICT) };
 * });
 * ```
 *
 * The factory imports it itself, because `vi.mock` is hoisted above the test file's imports.
 */
export const HUMAN_VERDICT: BotIdVerdict = {
	bypassed: false,
	isBot: false,
	isHuman: true,
	isVerifiedBot: false,
};

/** What `checkBotId()` answers for a bot. A case passes it to `mockResolvedValueOnce`. */
export const BOT_VERDICT: BotIdVerdict = {
	bypassed: false,
	isBot: true,
	isHuman: false,
	isVerifiedBot: false,
};
