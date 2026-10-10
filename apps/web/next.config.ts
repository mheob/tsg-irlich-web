import process from 'node:process';

import type { NextConfig } from 'next';

import { getArchiveHeaders, getArchiveRewrites } from './src/lib/echo/archive-url';

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
		useTypeScriptCli: true,
	},
	// Old TSG-Echo issues are served through `/echo-archiv` with `X-Robots-Tag: noindex`.
	// oxlint-disable-next-line typescript/require-await -- Next.js wants a promise, there is nothing to await
	headers: async () => getArchiveHeaders(),
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
	// pdf.js reads its WebAssembly decoders, fonts, CMaps and ICC profiles from disk at runtime,
	// which output tracing cannot see. Without the decoders black-and-white scans render blank.
	outputFileTracingIncludes: {
		'/api/echo/render': [
			'../../node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/{cmaps,iccs,standard_fonts,wasm}/**/*',
		],
	},
	// @napi-rs/canvas ships a native binary that Turbopack cannot bundle ("non-ecmascript
	// placeable asset"); pdfjs-dist stays external with it so its worker resolves next to it.
	// oxlint-disable-next-line typescript/require-await -- see headers
	rewrites: async () =>
		getArchiveRewrites({
			dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
			projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
		}),
	serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
};

export default nextConfig;
