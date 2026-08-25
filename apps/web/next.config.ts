import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
		useTypeScriptCli: true,
	},
	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				hostname: 'cdn.sanity.io',
				protocol: 'https',
			},
			{
				hostname: 'uploads.linear.app',
				protocol: 'https',
			},
		],
	},
};

export default nextConfig;
