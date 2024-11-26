/* eslint-disable node/prefer-global/process */

import { unstable_noStore as noStore } from 'next/cache';

import 'server-only';

export function getApiKey() {
	noStore();

	const token = process.env.SANITY_API_READ_TOKEN;

	if (!token) throw new Error('Missing SANITY_API_READ_TOKEN');

	return token;
}
