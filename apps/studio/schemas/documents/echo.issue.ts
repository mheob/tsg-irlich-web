import { RiBookOpenLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { timeSpanInMilliSeconds } from '@tsgi-web/shared';

import { general, meta, pages } from '@/shared/field-groups';
import { introField, slugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { validatePdfFile } from '@/shared/fields/pdf';

const YEAR_LENGTH = 4;
/** Longer than the render route's `maxDuration` of 800 s: a run still pending then was cut off. */
const STALE_AFTER_MINUTES = 15;
const STALE_AFTER_MS = timeSpanInMilliSeconds('minute') * STALE_AFTER_MINUTES;

const STATUS_LABELS: Record<string, string> = {
	done: 'Seiten fertig',
	failed: 'Fehler beim Erzeugen',
	pending: 'Seiten werden erzeugt',
};

/**
 * Where the page generation stands, in words for the editors.
 *
 * @param render - The `render.status` and `render.startedAt`, if any run has started.
 * @returns The label, e.g. `Seiten fertig`.
 */
function getRenderLabel(render: { startedAt?: string; status?: string }): string {
	if (!render.status) {
		return 'Noch keine Seiten';
	}
	const startedAt = render.startedAt ? Date.parse(render.startedAt) : Number.NaN;
	if (render.status === 'pending' && Date.now() - startedAt > STALE_AFTER_MS) {
		return 'Abgebrochen – „Seiten neu erzeugen“';
	}
	return STATUS_LABELS[render.status] ?? render.status;
}

/**
 * The subtitle of an issue in lists: its year and where the page generation stands.
 *
 * @param releaseDate - The release date as `YYYY-MM-DD`.
 * @param render - The `render.status` and `render.startedAt`, if any run has started.
 * @returns The subtitle, e.g. `2025 · Seiten fertig`.
 */
function getSubtitle(
	releaseDate: string | undefined,
	render: { startedAt?: string; status?: string },
): string {
	return [releaseDate?.slice(0, YEAR_LENGTH), getRenderLabel(render)].filter(Boolean).join(' · ');
}

const echoIssue = defineType({
	fields: [
		titleField,
		slugField,
		defineField({
			description: 'Bestimmt die Reihenfolge im Archiv und das angezeigte Jahr.',
			group: 'general',
			name: 'releaseDate',
			title: 'Erscheinungsdatum',
			type: 'date',
			validation: (Rule) => Rule.required().error('Das Erscheinungsdatum ist erforderlich'),
		}),
		defineField({
			description:
				'Die komplette Ausgabe als PDF. Nach dem Hochladen erzeugt die Website die Seiten zum Durchblättern automatisch; das dauert wenige Minuten.',
			group: 'general',
			name: 'pdf',
			options: { accept: 'application/pdf' },
			title: 'PDF',
			type: 'file',
			validation: (Rule) => [
				Rule.required().error('Die PDF ist erforderlich'),
				Rule.custom(validatePdfFile),
			],
		}),
		defineField({
			...introField,
			description:
				'Zwei bis drei Sätze zur Ausgabe. Die KI-Anweisung „Intro erzeugen“ schlägt einen Text aus dem Inhalt der Ausgabe vor.',
			rows: 4,
		}),
		defineField({
			description:
				'Aus: Die Ausgabe bleibt auf der Website lesbar, Suchmaschinen finden aber weder die Seite noch ihre Dateien. Gedacht für ältere Ausgaben mit Namen, Kontaktdaten oder Fotos von Kindern. Vollständig wirkt es nur, wenn es vor dem ersten Veröffentlichen aus ist: Dateien, die schon öffentlich waren, bleiben unter ihrer alten Adresse erreichbar.',
			group: 'general',
			initialValue: true,
			name: 'indexable',
			title: 'In Suchmaschinen auffindbar',
			type: 'boolean',
		}),
		metaField,
		defineField({
			description: 'Wird automatisch aus der PDF erzeugt.',
			group: 'pages',
			name: 'pages',
			of: [defineArrayMember({ type: 'image' })],
			readOnly: true,
			title: 'Seiten',
			type: 'array',
		}),
		defineField({
			description: 'Die Textebene der PDF. Bei eingescannten Ausgaben bleibt sie leer.',
			group: 'pages',
			name: 'extractedText',
			readOnly: true,
			rows: 8,
			title: 'Text der Ausgabe',
			type: 'text',
		}),
		defineField({
			fields: [
				defineField({ name: 'source', title: 'Erzeugt aus', type: 'string' }),
				defineField({
					name: 'status',
					options: {
						list: [
							{ title: 'Wird erzeugt', value: 'pending' },
							{ title: 'Fertig', value: 'done' },
							{ title: 'Fehler', value: 'failed' },
						],
					},
					title: 'Status',
					type: 'string',
				}),
				defineField({ name: 'pageCount', title: 'Seitenzahl', type: 'number' }),
				defineField({ name: 'error', rows: 3, title: 'Fehlermeldung', type: 'text' }),
				defineField({ name: 'startedAt', title: 'Gestartet', type: 'datetime' }),
				defineField({ name: 'finishedAt', title: 'Beendet', type: 'datetime' }),
			],
			group: 'pages',
			name: 'render',
			readOnly: true,
			title: 'Erzeugung',
			type: 'object',
		}),
	],
	groups: [general, meta, pages],
	icon: RiBookOpenLine,
	name: 'echo.issue',
	orderings: [
		{
			by: [{ direction: 'desc', field: 'releaseDate' }],
			name: 'releaseDateDesc',
			title: 'Erscheinungsdatum, neuste zuerst',
		},
	],
	preview: {
		prepare: ({
			media,
			releaseDate,
			startedAt,
			status,
			title,
		}: {
			media?: PreviewValue['media'];
			releaseDate?: string;
			startedAt?: string;
			status?: string;
			title?: string;
		}) => ({ media, subtitle: getSubtitle(releaseDate, { startedAt, status }), title }),
		select: {
			media: 'pages.0.asset',
			releaseDate: 'releaseDate',
			startedAt: 'render.startedAt',
			status: 'render.status',
			title: 'title',
		},
	},
	title: 'TSG-Echo-Ausgabe',
	type: 'document',
});

export default echoIssue;
