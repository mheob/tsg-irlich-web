import { describe, expect, it } from 'vitest';

import { marker, stripCleverReachMarkers, toCleverReachTemplate } from './cleverreach-markers';

describe('marker building', () => {
	it('builds a marker without attributes', () => {
		expect(marker('html')).toBe('@@CR|html@@');
	});

	it('appends every attribute', () => {
		expect(marker('img', { name: 'hero', src: 'logo.png' })).toBe(
			'@@CR|img|name=hero|src=logo.png@@',
		);
	});

	it('drops attributes that are undefined', () => {
		expect(marker('img', { name: 'hero', src: undefined })).toBe('@@CR|img|name=hero@@');
	});
});

describe('template conversion', () => {
	it('turns a marker into a CleverReach comment', () => {
		expect(toCleverReachTemplate('<p>@@CR|html@@</p>')).toBe('<p><!--#html#--></p>');
	});

	it('renders attributes as HTML attributes', () => {
		expect(toCleverReachTemplate('@@CR|img|name=hero@@')).toBe('<!--#img name="hero"#-->');
	});

	it('converts every marker in the document', () => {
		expect(toCleverReachTemplate('@@CR|html@@ and @@CR|loopitem@@')).toBe(
			'<!--#html#--> and <!--#loopitem#-->',
		);
	});

	it('removes the separators React inserts between children', () => {
		expect(toCleverReachTemplate('a<!-- -->b')).toBe('ab');
	});

	it('leaves HTML without markers untouched', () => {
		expect(toCleverReachTemplate('<p>Hallo TSG-Familie!</p>')).toBe('<p>Hallo TSG-Familie!</p>');
	});
});

describe('marker stripping', () => {
	it('removes a marker and keeps the surrounding HTML', () => {
		expect(stripCleverReachMarkers('<p>@@CR|html@@Text</p>')).toBe('<p>Text</p>');
	});

	it('removes every marker', () => {
		expect(stripCleverReachMarkers('@@CR|html@@a@@CR|img|name=hero@@b')).toBe('ab');
	});

	it('leaves HTML without markers untouched', () => {
		expect(stripCleverReachMarkers('<p>Text</p>')).toBe('<p>Text</p>');
	});
});
