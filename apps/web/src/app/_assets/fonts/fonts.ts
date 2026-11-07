import localFont from 'next/font/local';

// oxlint-disable-next-line import/no-unassigned-import
import './latin-ext.css';

/*
 * The fonts live in the repository rather than coming through `next/font/google`, whose build-time
 * fetch fails whenever Google answers with `/l/font?kit=…` URLs (vercel/next.js#99114). The faces
 * mirror Google's CSS: one variable file per weight, and the `latin` range, repeated because
 * `next/font` only takes literals. The `latin-ext` faces in `latin-ext.css` join these families by
 * the names `next/font/local` derives from the variable names below, so renaming a variable means
 * renaming it there too. See "Fonts" in `apps/web/AGENTS.md`.
 *
 * They sit in a module of their own because two documents load them: the root layout and
 * `global-error.tsx`, which replaces the layout when the layout itself fails.
 */

const oswald = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [
		{ path: './oswald/latin.woff2', style: 'normal', weight: '400' },
		{ path: './oswald/latin.woff2', style: 'normal', weight: '700' },
	],
	variable: '--font-sans-serif',
});

const bebasNeue = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [{ path: './bebas-neue/latin.woff2', style: 'normal', weight: '400' }],
	variable: '--font-serif',
});

const inter = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [
		{ path: './inter/latin.woff2', style: 'normal', weight: '400' },
		{ path: './inter/latin.woff2', style: 'normal', weight: '700' },
	],
	variable: '--font-sans',
});

/** The class names that put the three font variables on an element, meant for `<body>`. */
const fontVariables = `${oswald.variable} ${bebasNeue.variable} ${inter.variable}`;

export { fontVariables };
