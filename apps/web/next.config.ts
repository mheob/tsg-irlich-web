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
	// pdf.js reads its WebAssembly decoders, fonts, CMaps and ICC profiles from disk at runtime,
	// which output tracing cannot see. Without the decoders black-and-white scans render blank.
	outputFileTracingIncludes: {
		'/api/echo/render': [
			'../../node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/{cmaps,iccs,standard_fonts,wasm}/**/*',
		],
	},
	// @napi-rs/canvas ships a native binary that Turbopack cannot bundle ("non-ecmascript
	// placeable asset"); pdfjs-dist stays external with it so its worker resolves next to it.
	serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
};

export default nextConfig;
