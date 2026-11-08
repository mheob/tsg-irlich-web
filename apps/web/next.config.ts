import { withBotId } from 'botid/next/config';
import type { NextConfig } from 'next';

// With the extension: Node.js loads this file with its own TypeScript support, as an ES module.
import { getLegacyRedirects } from './src/lib/redirects/legacy-redirects.ts';

/**
 * The overviews that page through their content with `?seite=N`. A page that reads its search
 * parameters renders on every request, so each one serves only its first page itself, and the later
 * pages come from an internal route below it, `<overview>/seite/[page]`, which is rendered once and
 * cached like any static page. The public address keeps the parameter (WEB-415).
 */
const PAGINATED_OVERVIEWS = ['/news', '/news/:category', '/verein/echo'];

/**
 * A later page in the query string: 2 or more, without leading zeros. Next.js anchors the pattern.
 * The first page, and anything that is no page number, stays with the overview, which shows page 1.
 */
const LATER_PAGE_QUERY = {
	key: 'seite',
	type: 'query',
	value: String.raw`(?<page>[2-9]|[1-9]\d+)`,
} as const;

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
	// The internal route of a later page has no address of its own: a request for it goes to the public
	// one, so a page is never listed twice. Redirects apply before the rewrites, and only to the
	// requested path, so the rewritten request does not come back here. The addresses of the old
	// WordPress site follow (WEB-420).
	// oxlint-disable-next-line typescript/require-await -- Next.js takes an async function only
	redirects: async () => [
		...PAGINATED_OVERVIEWS.map((overview) => ({
			destination: `${overview}?seite=:page`,
			permanent: true,
			source: `${overview}/seite/:page`,
		})),
		...getLegacyRedirects(),
	],
	// Before the files: `/news` and `/verein/echo` are pages of their own, which would answer first.
	// oxlint-disable-next-line typescript/require-await -- Next.js takes an async function only
	rewrites: async () => ({
		afterFiles: [],
		beforeFiles: PAGINATED_OVERVIEWS.map((overview) => ({
			destination: `${overview}/seite/:page`,
			has: [LATER_PAGE_QUERY],
			source: overview,
		})),
		fallback: [],
	}),
	// @napi-rs/canvas ships a native binary that Turbopack cannot bundle ("non-ecmascript
	// placeable asset"); pdfjs-dist stays external with it so its worker resolves next to it.
	serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
};

export default withBotId(nextConfig);
