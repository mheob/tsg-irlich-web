import { defineQuery } from 'next-sanity';

/**
 * Query to get the groups page
 *
 * @returns The groups page
 */
const offerGroupsPageQuery = defineQuery(`*[_type == 'groupsPage'][0]`);

export { offerGroupsPageQuery };
