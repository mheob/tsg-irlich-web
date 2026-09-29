import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JsonLd } from './json-ld';

function renderScript(name: string): HTMLScriptElement {
	const { container } = render(
		<JsonLd data={{ '@context': 'https://schema.org', '@type': 'Thing', name }} />,
	);
	const script = container.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');

	if (!script) {
		throw new Error('Expected a JSON-LD script element');
	}

	return script;
}

describe('structured data', () => {
	it('embeds the data as JSON-LD', () => {
		expect(JSON.parse(renderScript('TSG Irlich').text)).toStrictEqual({
			'@context': 'https://schema.org',
			'@type': 'Thing',
			name: 'TSG Irlich',
		});
	});

	it('cannot be closed early by a string from the CMS', () => {
		const script = renderScript('</script><img src=x onerror=alert(1)>');

		expect(script.innerHTML).not.toContain('</script>');
		expect(JSON.parse(script.text)).toMatchObject({
			name: '</script><img src=x onerror=alert(1)>',
		});
	});
});
