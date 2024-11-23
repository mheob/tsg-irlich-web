import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [{ hostname: 'next.tsg-irlich.de' }],
	},
};

export default nextConfig;
