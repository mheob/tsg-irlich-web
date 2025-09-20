import { defineQuery } from 'next-sanity';

/**
 * Query to get the privacy page
 *
 * @returns The privacy page with all fields
 */
export const privacyPageQuery = defineQuery(`*[_type == 'privacy'][0]`);
