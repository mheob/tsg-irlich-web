import { defineQuery } from 'next-sanity';

/**
 * Query to get the accessability page
 *
 * @returns The accessability page with all fields
 */
export const accessabilityPageQuery = defineQuery(`*[_type == 'accessability'][0]`);
