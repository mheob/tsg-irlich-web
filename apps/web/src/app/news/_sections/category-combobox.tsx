'use client';

import { useRouter } from 'next/navigation';

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
import type { NewsCategoriesQueryResult } from '@/types/sanity.types';

const OVERVIEW_HREF = '/news';

/** `label` and `value` are the names Base UI reads an item's display text and identity from. */
interface CategoryOption {
	count: number;
	label: string;
	value: string;
}

interface CategoryComboboxProps extends NewsCategoriesQueryResult {
	className?: string;
	/** The slug of the category whose page renders the combobox; the overview passes none. */
	currentSlug?: string;
}

export function CategoryCombobox({
	categories,
	className,
	currentSlug,
	total,
}: Readonly<CategoryComboboxProps>) {
	const router = useRouter();

	const options: CategoryOption[] = [
		{ count: total, label: 'Alle News', value: OVERVIEW_HREF },
		...categories.map(({ articleCount, slug, title }) => ({
			count: articleCount,
			label: title,
			value: `${OVERVIEW_HREF}/${slug}`,
		})),
	];
	const currentHref = currentSlug ? `${OVERVIEW_HREF}/${currentSlug}` : OVERVIEW_HREF;

	return (
		<div className={className}>
			<Combobox
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
		</div>
	);
}
