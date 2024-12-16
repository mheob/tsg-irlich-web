import { defineQuery } from 'next-sanity';

export const socialMediaQuery = defineQuery(`*[_type == 'site-settings'][0].socialFields`);
