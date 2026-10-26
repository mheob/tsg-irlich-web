import { defineQuery } from 'next-sanity';

/**
 * The images the editors maintain once for several pages: the three of the vision section (home and
 * club page), the three next to the contact form (home and contact page) and the fallback image of
 * a department or group without one of its own.
 */
export const siteImagesQuery = defineQuery(
	`*[_type == 'site-settings'][0] { visionImages, contactFormImages, fallbackImage }`,
);
