'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
import type { NewsCategoriesQueryResult } from '@/types/sanity.types';

import { getCategoryOptions, getCurrentHref } from './category-options';
import type { CategoryOption } from './category-options';

interface CategoryComboboxFieldProps extends NewsCategoriesQueryResult {
	/** The slug of the category whose page renders the combobox; the overview passes none. */
	currentSlug?: string;
	/** Takes the focus as it mounts, because the placeholder it replaces had it. */
	hasFocusOnMount?: boolean;
	/** Opens its list as it mounts, because the placeholder it replaces was pressed. */
	isOpenOnMount?: boolean;
}

/**
 * The combobox that switches between the category pages of the news. `CategoryCombobox` loads it
 * once the page is idle or the field is used, so its Base UI code stays off the first load.
 *
 * @param props - The categories, the total and the current page, plus how the field was reached.
 * @param props.categories - The categories with at least one article.
 * @param props.currentSlug - The slug of the current category page.
 * @param props.hasFocusOnMount - Whether to take the focus as it mounts.
 * @param props.isOpenOnMount - Whether to open the list as it mounts.
 * @param props.total - The number of all articles.
 * @returns The combobox.
 */
export function CategoryComboboxField({
	categories,
	currentSlug,
	hasFocusOnMount = false,
	isOpenOnMount = false,
	total,
}: Readonly<CategoryComboboxFieldProps>) {
	const router = useRouter();
	const input = useRef<HTMLInputElement>(null);

	const options = getCategoryOptions(categories, total);
	const currentHref = getCurrentHref(currentSlug);

	useEffect(() => {
		if (hasFocusOnMount) {
			input.current?.focus();
		}
	}, [hasFocusOnMount]);

	return (
		<Combobox
			defaultOpen={isOpenOnMount}
			defaultValue={options.find((option) => option.value === currentHref)}
			isItemEqualToValue={(item, value) => item.value === value.value}
			items={options}
			onValueChange={(option) => {
				if (option && option.value !== currentHref) {
					router.push(option.value);
				}
			}}
		>
			<ComboboxInput
				aria-label="News-Kategorie"
				// Typing then replaces the selection instead of being appended to it.
				onFocus={(event) => {
					event.currentTarget.select();
				}}
				ref={input}
			/>
			<ComboboxContent>
				<ComboboxEmpty>Keine Kategorie gefunden</ComboboxEmpty>
				<ComboboxList>
					{(option: CategoryOption) => (
						<ComboboxItem
							aria-label={`${option.label}, ${option.count} Artikel`}
							className="first:mb-1 first:border-b first:pb-2"
							key={option.value}
							value={option}
						>
							<span className="truncate">{option.label}</span>
							<span className="ml-auto text-sm text-muted-foreground tabular-nums">
								{option.count}
							</span>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
