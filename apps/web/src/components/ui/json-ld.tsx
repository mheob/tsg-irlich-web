import type { Graph, Thing, WithContext } from 'schema-dts';

interface JsonLdProps {
	data: Graph | WithContext<Exclude<Thing, string>>;
}

/**
 * Embeds structured data for search engines and answer engines as JSON-LD.
 *
 * @param props - The component props.
 * @param props.data - The schema.org node or graph to embed.
 * @returns The script element.
 */
export function JsonLd({ data }: Readonly<JsonLdProps>) {
	return (
		<script
			// The data comes from the CMS. Escaping `<` keeps a `</script>` inside one of its strings
			// from closing the element early and injecting markup (see the Next.js guide on JSON-LD).
			// oxlint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', String.raw`\u003c`) }}
			type="application/ld+json"
		/>
	);
}
