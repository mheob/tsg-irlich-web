import { client } from '@/lib/sanity/client';
import { llmsTxtQuery } from '@/lib/sanity/queries/llms';
import type { LlmsTxtQueryResult } from '@/types/sanity.types';
import { groupSections } from '@/utils/groups';
import { getInternalHref } from '@/utils/links';
import { SITE_NAME } from '@/utils/metadata';
import { getBaseUrl } from '@/utils/url';

const LLMS_TXT_RESPONSE_HEADERS = {
	'Cache-Control': 'public, max-age=3600, s-maxage=3600',
	// Markdown by content, but served as plain text: browsers show it instead of downloading it.
	'Content-Type': 'text/plain; charset=utf-8',
};

/**
 * Formats one entry of a link list, the shape the llms.txt proposal (https://llmstxt.org) uses:
 * `- [Name](URL): notes`.
 *
 * @param name - The link text.
 * @param url - The absolute URL.
 * @param notes - A short description, if there is one.
 * @returns The list entry.
 */
function link(name: string, url: string, notes?: string | null): string {
	// A line break would end the list entry early.
	const description = notes?.replaceAll(/\s+/gu, ' ').trim();
	return description ? `- [${name}](${url}): ${description}` : `- [${name}](${url})`;
}

function buildContact(contact: LlmsTxtQueryResult['contact']): string[] {
	if (!contact) {
		return [];
	}

	const { city, houseNumber, street, zipCode } = contact.postalAddress;
	const address = `${street} ${houseNumber}, ${[zipCode, city].filter(Boolean).join(' ')}`;

	return [`Anschrift: ${address}`, `E-Mail: ${contact.email}`, `Telefon: ${contact.phone}`];
}

function buildDepartment(
	section: (typeof groupSections)[number],
	groups: LlmsTxtQueryResult['groups'],
	baseUrl: string,
): string[] {
	const entries = groups.flatMap((group) => {
		const href = group._type === section._type ? getInternalHref(group) : undefined;
		return href ? [link(group.title, `${baseUrl}${href}`, group.description)] : [];
	});

	return [
		`## ${section.title}`,
		'',
		link(`Alle Gruppen: ${section.title}`, `${baseUrl}${section.slug}`),
		...entries,
		'',
	];
}

/**
 * Builds the llms.txt of the site: a Markdown summary of the club and its offer for language
 * models, following the llms.txt proposal (https://llmstxt.org).
 *
 * @param content - The content from Sanity.
 * @param baseUrl - The site's base URL.
 * @returns The file content.
 */
function buildLlmsTxt(content: LlmsTxtQueryResult, baseUrl: string): string {
	const lines = [
		`# ${SITE_NAME}`,
		'',
		...(content.description ? [`> ${content.description}`, ''] : []),
		...buildContact(content.contact),
		'',
		...groupSections.flatMap((section) => buildDepartment(section, content.groups, baseUrl)),
		'## Verein',
		'',
		link('Über den Verein', `${baseUrl}/verein`, content.aboutUs),
		link('Mitgliedschaft', `${baseUrl}/mitgliedschaft`, content.membership),
		link('Aktuelles', `${baseUrl}/news`, 'Neuigkeiten aus dem Verein und seinen Abteilungen'),
		link('Kontakt', `${baseUrl}/kontakt`),
		'',
		'## Optional',
		'',
		link('RSS-Feed', `${baseUrl}/feed.xml`),
		link('Sitemap', `${baseUrl}/sitemap.xml`),
		link('Impressum', `${baseUrl}/impressum`),
		link('Datenschutz', `${baseUrl}/datenschutz`),
		link('Barrierefreiheit', `${baseUrl}/barrierefreiheit`),
	];

	return `${lines.join('\n').replaceAll(/\n{3,}/gu, '\n\n')}\n`;
}

export async function GET(): Promise<Response> {
	const content = await client.fetch<LlmsTxtQueryResult>(llmsTxtQuery);

	return new Response(buildLlmsTxt(content, getBaseUrl()), { headers: LLMS_TXT_RESPONSE_HEADERS });
}
