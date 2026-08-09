import { z } from 'zod';

import { MS_PER_SECOND, timeSpanInMilliSeconds } from '@tsgi-web/shared';

import { env } from './env';

const UNIX_TIMESTAMP_DIVISOR = 1000;
const HTTP_CONFLICT = 409;

const CLEVERREACH_API_BASE = 'https://rest.cleverreach.com';

const FIVE_MINUTES = timeSpanInMilliSeconds('minute') * 5;

// Token cache to avoid unnecessary authentication requests
let tokenCache: null | { expiresAt: number; token: string } = null;

const accessTokenSchema = z.object({ access_token: z.string(), expires_in: z.number() });

/**
 * Retrieves a CleverReach API access token using client credentials grant.
 *
 * Implements an in-memory cache to minimize unnecessary authentication requests.
 * The token is only re-requested if the previous token has expired
 * or will expire within the next 5 minutes ("buffer" to avoid just-expired tokens).
 *
 * @returns The OAuth access token.
 * @throws {Error} If authentication fails or required environment variables are missing.
 */
async function getAccessToken(): Promise<string> {
	// Use token cache if token is available and not about to expire (5 min buffer).
	if (tokenCache && tokenCache.expiresAt > Date.now() + FIVE_MINUTES) {
		return tokenCache.token;
	}

	/**
	 * Request a new access token from CleverReach OAuth endpoint.
	 * See https://rest.cleverreach.com/howto/auth/
	 */
	const response = await fetch(`${CLEVERREACH_API_BASE}/oauth/token.php`, {
		body: new URLSearchParams({
			client_id: env('CLEVERREACH_CLIENT_ID'),
			client_secret: env('CLEVERREACH_CLIENT_SECRET'),
			grant_type: 'client_credentials',
		}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		method: 'POST',
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`CleverReach authentication failed: ${error}`);
	}

	const payload: unknown = await response.json();
	const data = accessTokenSchema.parse(payload);

	// Store token and expiry for future requests (expires_in is seconds from now)
	tokenCache = {
		expiresAt: Date.now() + data.expires_in * MS_PER_SECOND,
		token: data.access_token,
	};

	return data.access_token;
}

/**
 * Subscriber schema for validation
 *
 * @example
 *   const validation = subscriberSchema.safeParse({ email: 'test@example.com' });
 *   if (!validation.success) {
 *     return { error: validation.error.message, success: false };
 *   }
 */
const subscriberSchema = z.object({
	email: z.email('Invalid email address'),
});

type SubscriberInput = z.infer<typeof subscriberSchema>;

// Response types
type SubscribeResult =
	| { code?: string; error: string; success: false }
	| { message: string; success: true };

// DOI metadata for GDPR tracking
interface DoiMetadata {
	referer: string;
	userAgent: string;
	userIp: string;
}

type AddReceiverResult = { code?: string; error: string; success: false } | { success: true };

const subscriberErrorDetailsSchema = z.object({
	code: z.union([z.number(), z.string()]).optional(),
	message: z.string().optional(),
});

const subscriberErrorSchema = z.object({ error: subscriberErrorDetailsSchema.optional() });

async function addReceiver(
	email: string,
	token: string,
	listId: string,
): Promise<AddReceiverResult> {
	const response = await fetch(`${CLEVERREACH_API_BASE}/v3/groups.json/${listId}/receivers`, {
		body: JSON.stringify({
			activated: 0,
			email,
			// oxlint-disable-next-line unicorn/max-nested-calls
			registered: Math.floor(Date.now() / UNIX_TIMESTAMP_DIVISOR),
			source: 'Next.js Website',
		}),
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		method: 'POST',
	});

	if (response.ok) {
		return { success: true };
	}

	const errorPayload: unknown = await response.json().catch(() => ({}));
	const errorData = subscriberErrorSchema.safeParse(errorPayload);

	if (response.status === HTTP_CONFLICT) {
		return {
			code: 'ALREADY_SUBSCRIBED',
			error: 'This email is already subscribed',
			success: false,
		};
	}

	const errorDetails = errorData.success ? errorData.data.error : undefined;

	return {
		code: errorDetails?.code?.toString(),
		error: errorDetails?.message ?? 'Failed to add subscriber',
		success: false,
	};
}

interface SendDoiEmailParams {
	doiMetadata: DoiMetadata;
	email: string;
	formId: string;
	listId: string;
	token: string;
}

async function sendDoiEmail({
	doiMetadata,
	email,
	formId,
	listId,
	token,
}: SendDoiEmailParams): Promise<void> {
	const response = await fetch(`${CLEVERREACH_API_BASE}/v3/forms.json/${formId}/send/activate`, {
		body: JSON.stringify({
			doidata: {
				referer: doiMetadata.referer,
				user_agent: doiMetadata.userAgent,
				user_ip: doiMetadata.userIp,
			},
			email,
			groups_ids: [listId],
		}),
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		method: 'POST',
	});

	if (!response.ok) {
		console.error('Failed to send DOI email, but receiver was added:', await response.text());
	}
}

function resolveDoiMetadata(doiMetadata?: DoiMetadata): DoiMetadata {
	const productionUrl = env('VERCEL_PROJECT_PRODUCTION_URL');

	return {
		referer: doiMetadata?.referer ?? (productionUrl ? `https://${productionUrl}` : ''),
		userAgent: doiMetadata?.userAgent ?? 'Mozilla/5.0',
		userIp: doiMetadata?.userIp ?? '0.0.0.0',
	};
}

async function performSubscription(
	email: string,
	doiMetadata?: DoiMetadata,
): Promise<SubscribeResult> {
	const token = await getAccessToken();
	const listId = env('CLEVERREACH_LIST_ID');
	const formId = env('CLEVERREACH_FORM_ID');

	const addResult = await addReceiver(email, token, listId);

	if (!addResult.success) {
		return addResult;
	}

	await sendDoiEmail({
		doiMetadata: resolveDoiMetadata(doiMetadata),
		email,
		formId,
		listId,
		token,
	});

	return { message: 'Please check your email to confirm your subscription', success: true };
}

/**
 * Subscribe a user to the newsletter via CleverReach.
 *
 * @param input - The subscriber input data.
 * @param doiMetadata - The DOI metadata for GDPR tracking.
 * @returns The subscribe result.
 */
async function subscribe(
	input: SubscriberInput,
	doiMetadata?: DoiMetadata,
): Promise<SubscribeResult> {
	const validation = subscriberSchema.safeParse(input);

	if (!validation.success) {
		return {
			code: 'VALIDATION_ERROR',
			error: validation.error.message,
			success: false,
		};
	}

	try {
		return await performSubscription(validation.data.email, doiMetadata);
	} catch (error) {
		console.error('CleverReach subscription error:', error);

		return {
			code: 'INTERNAL_ERROR',
			error: 'An unexpected error occurred. Please try again later.',
			success: false,
		};
	}
}

export {
	subscriberSchema,
	type SubscriberInput,
	type SubscribeResult,
	type DoiMetadata,
	subscribe,
};
