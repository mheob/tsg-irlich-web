import { client } from '@/lib/sanity/client';
import { llmsTxtQuery } from '@/lib/sanity/queries/llms';
import type { LlmsTxtQueryResult } from '@/types/sanity.types';
import { getInternalHref } from '@/utils/links';
import { CLUB_FOUNDING_YEAR, CLUB_LEGAL_NAME, SITE_NAME } from '@/utils/metadata';
import { SEASON_LABELS, WEEKDAY_LABELS } from '@/utils/training';
import { getBaseUrl } from '@/utils/url';

type Department = LlmsTxtQueryResult['departments'][number];
type TrainingTime = NonNullable<Department['groups'][number]['trainingTimes']>[number];

const PRICE_FORMAT = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

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

/**
 * Describes one training time as a nested list entry below its group, so a language model can answer
 * when and where a group trains (WEB-424).
 *
 * @param time - The training time.
 * @returns The list entry.
 */
function formatTrainingTime(time: TrainingTime): string {
	const details = [time.venue, SEASON_LABELS[time.season]].filter(Boolean).join(', ');
	const hours = `${time.startTime}–${time.endTime} Uhr`;
	return `  - Training: ${WEEKDAY_LABELS[time.weekday]} ${hours}${details ? ` (${details})` : ''}`;
}

/**
 * Lists the membership fees the home page and the membership page show.
 *
 * @param prices - The fees from the pricing section, or `null` without one.
 * @returns The section, or nothing without fees.
 */
function buildPrices(prices: LlmsTxtQueryResult['prices']): string[] {
	const tiers = prices
		? [prices.pricingYouth, prices.pricingAdult, prices.pricingFamily].filter((tier) =>
				Boolean(tier.title),
			)
		: [];
	if (tiers.length === 0) {
		return [];
	}

	return [
		'## Mitgliedsbeiträge',
		'',
		...tiers.map(
			({ price, subtitle, title }) =>
				`- ${title}${subtitle ? ` (${subtitle})` : ''}: ${PRICE_FORMAT.format(price)} € monatlich`,
		),
		'',
	];
}

function buildDepartment(department: Department, baseUrl: string): string[] {
	const departmentHref = getInternalHref({ _type: 'department', slug: department.slug });
	if (!departmentHref) {
		return [];
	}

	const entries = department.groups.flatMap((group) => {
		const href = getInternalHref(group);
		return href
			? [
					link(group.title, `${baseUrl}${href}`, group.description),
					...(group.trainingTimes ?? []).map((time) => formatTrainingTime(time)),
				]
			: [];
	});

	return [
		`## ${department.title}`,
		'',
		link(
			`Alle Gruppen: ${department.title}`,
			`${baseUrl}${departmentHref}`,
			department.description,
		),
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
		`Gegründet: ${CLUB_FOUNDING_YEAR}`,
		`Vereinsname: ${CLUB_LEGAL_NAME}`,
		...buildContact(content.contact),
		'',
		...content.departments.flatMap((department) => buildDepartment(department, baseUrl)),
		...buildPrices(content.prices),
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
