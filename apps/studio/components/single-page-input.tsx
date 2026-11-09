import { Card, Stack, Text } from '@sanity/ui';
import type { ReactNode } from 'react';
import { useSchema } from 'sanity';
import type { InputProps } from 'sanity';

import { findSinglePage } from '@/structure/pages';
import type { SinglePageInfo } from '@/structure/pages';

/**
 * Tells the editors where a single page sits on the website: its address, the page it sits under,
 * and for a page every page of one kind shares, what an edit there changes.
 *
 * @param props - The props.
 * @param props.page - The place of the page, from `structure/pages.ts`.
 * @returns The note.
 */
function SinglePageNote({ page }: Readonly<{ page: SinglePageInfo }>): ReactNode {
	const schema = useSchema();
	const parentTitle = page.parent ? (schema.get(page.parent)?.title ?? page.parent) : undefined;

	return (
		<Card border padding={3} radius={2} tone="primary">
			<Stack gap={3}>
				<Text size={1}>
					Adresse auf der Website: <code>{page.path}</code>
					{parentTitle ? ` · Unterseite von „${parentTitle}“` : null}
				</Text>
				{page.note ? <Text size={1}>{page.note}</Text> : null}
			</Stack>
		</Card>
	);
}

/**
 * Wraps every input of the studio and puts the note of `SinglePageNote` above the form of a single
 * page. Any other input, and every field inside a single page, renders unchanged.
 *
 * @param props - The props of the input.
 * @returns The input, preceded by the note on a single page.
 */
export function SinglePageInput(props: Readonly<InputProps>): ReactNode {
	const page = props.path.length === 0 ? findSinglePage(props.schemaType.name) : undefined;
	if (!page) {
		return props.renderDefault(props);
	}

	return (
		<Stack gap={5}>
			<SinglePageNote page={page} />
			{props.renderDefault(props)}
		</Stack>
	);
}
