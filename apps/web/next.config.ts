import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				hostname: 'next.tsg-irlich.de',
				pathname: '/**',
				protocol: 'https',
			},
		],
	},
};

export default nextConfig;
