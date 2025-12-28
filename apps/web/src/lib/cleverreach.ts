// cspell:words doidata, sendactivationmail
import process from 'node:process';

import { z } from 'zod';

const envSchema = z.object({
	CLEVERREACH_CLIENT_ID: z.string().min(1),
	CLEVERREACH_CLIENT_SECRET: z.string().min(1),
	CLEVERREACH_FORM_ID: z.string().min(1),
	CLEVERREACH_LIST_ID: z.string().min(1),
});

type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
	const result = envSchema.safeParse({
		CLEVERREACH_CLIENT_ID: process.env.CLEVERREACH_CLIENT_ID,
		CLEVERREACH_CLIENT_SECRET: process.env.CLEVERREACH_CLIENT_SECRET,
		CLEVERREACH_FORM_ID: process.env.CLEVERREACH_FORM_ID,
		CLEVERREACH_LIST_ID: process.env.CLEVERREACH_LIST_ID,
	});

	if (!result.success) {
		throw new Error(`Missing CleverReach environment variables: ${result.error.message}`);
	}

	return result.data;
}

const CLEVERREACH_API_BASE = 'https://rest.cleverreach.com';

// Token cache to avoid unnecessary authentication requests
let tokenCache: null | { expiresAt: number; token: string } = null;

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
	if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
		return tokenCache.token;
	}

	const env = getEnv();

	/**
	 * Request a new access token from CleverReach OAuth endpoint.
	 * See https://rest.cleverreach.com/howto/auth/
	 */
	const response = await fetch(`${CLEVERREACH_API_BASE}/oauth/token.php`, {
		body: new URLSearchParams({
			client_id: env.CLEVERREACH_CLIENT_ID,
			client_secret: env.CLEVERREACH_CLIENT_SECRET,
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

	const data: { access_token: string; expires_in: number } = await response.json();

	// Store token and expiry for future requests (expires_in is seconds from now)
	tokenCache = {
		expiresAt: Date.now() + data.expires_in * 1000,
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
export const subscriberSchema = z.object({
	email: z.email('Invalid email address'),
});

export type SubscriberInput = z.infer<typeof subscriberSchema>;

// Response types
export type SubscribeResult =
	| { code?: string; error: string; success: false }
	| { message: string; success: true };

// DOI metadata for GDPR tracking
export interface DoiMetadata {
	referer: string;
	userAgent: string;
	userIp: string;
}

/**
 * Subscribe a user to the newsletter via CleverReach.
 *
 * @param input - The subscriber input data.
 * @param doiMetadata - The DOI metadata for GDPR tracking.
 * @returns The subscribe result.
 */
export async function subscribe(
	input: SubscriberInput,
	doiMetadata?: DoiMetadata,
): Promise<SubscribeResult> {
	const validation = subscriberSchema.safeParse(input);

	if (!validation.success) {
		return {
			code: 'VALIDATION_ERROR',
			error: validation.error.message ?? 'Validation failed',
			success: false,
		};
	}

	const { email } = validation.data;

	try {
		const token = await getAccessToken();
		const env = getEnv();

		// First, add the receiver to the group
		const addResponse = await fetch(
			`${CLEVERREACH_API_BASE}/v3/groups.json/${env.CLEVERREACH_LIST_ID}/receivers`,
			{
				body: JSON.stringify({
					activated: 0,
					email,
					registered: Math.floor(Date.now() / 1000),
					source: 'Next.js Website',
				}),
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
			},
		);

		if (!addResponse.ok) {
			const errorData = await addResponse.json().catch(() => ({}));

			if (addResponse.status === 409) {
				return {
					code: 'ALREADY_SUBSCRIBED',
					error: 'This email is already subscribed',
					success: false,
				};
			}

			return {
				code: errorData.error?.code?.toString(),
				error: errorData.error?.message ?? 'Failed to add subscriber',
				success: false,
			};
		}

		// Then trigger the Double Opt-in email
		const doiResponse = await fetch(
			`${CLEVERREACH_API_BASE}/v3/forms.json/${env.CLEVERREACH_FORM_ID}/send/activate`,
			{
				body: JSON.stringify({
					doidata: {
						referer: doiMetadata?.referer ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
						user_agent: doiMetadata?.userAgent ?? 'Mozilla/5.0',
						user_ip: doiMetadata?.userIp ?? '0.0.0.0',
					},
					email,
					groups_ids: [env.CLEVERREACH_LIST_ID],
				}),
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
			},
		);

		if (!doiResponse.ok) {
			console.error('Failed to send DOI email, but receiver was added:', await doiResponse.text());
		}

		return {
			message: 'Please check your email to confirm your subscription',
			success: true,
		};
	} catch (error) {
		console.error('CleverReach subscription error:', error);

		return {
			code: 'INTERNAL_ERROR',
			error: 'An unexpected error occurred. Please try again later.',
			success: false,
		};
	}
}
