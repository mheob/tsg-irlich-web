import { describe, expect, it } from 'vite-plus/test';

import { getPdfUrl } from './asset-url';

const LOCATION = { dataset: 'development', projectId: 'j4rxwl5m' };
const HASH = '8c3211369d3d2da0c150d50d7cb5bca911b15f5e';

describe('pdf asset url', () => {
	it('builds the CDN url of a PDF asset reference', () => {
		expect(getPdfUrl(`file-${HASH}-pdf`, LOCATION)).toBe(
			`https://cdn.sanity.io/files/j4rxwl5m/development/${HASH}.pdf`,
		);
	});

	it.each([
		['an image asset', `image-${HASH}-2000x1414-jpg`],
		['a file of another type', `file-${HASH}-zip`],
		['a hash that is too short', 'file-8c32-pdf'],
		['upper-case hex', `file-${HASH.toUpperCase()}-pdf`],
		['a path', `file-${HASH}-pdf/../../secret`],
		['a full url', `https://evil.example/file-${HASH}-pdf`],
		['an empty string', ''],
	])('rejects %s', (_label, ref) => {
		expect(getPdfUrl(ref, LOCATION)).toBeUndefined();
	});

	it('takes project and dataset from the location, never from the reference', () => {
		expect(getPdfUrl(`file-${HASH}-pdf`, { dataset: 'production', projectId: 'abc123' })).toBe(
			`https://cdn.sanity.io/files/abc123/production/${HASH}.pdf`,
		);
	});
});
