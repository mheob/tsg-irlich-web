/* eslint-disable node/prefer-global/process */

import 'server-only';

export const token = process.env.SANITY_API_READ_TOKEN;

console.log({ token });

if (!token) throw new Error('Missing SANITY_API_READ_TOKEN');
