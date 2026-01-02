import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/utils/url';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getBaseUrl();

	return {
		host: baseUrl,
		rules: [
			{
				allow: '/',
				userAgent: '*',
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
