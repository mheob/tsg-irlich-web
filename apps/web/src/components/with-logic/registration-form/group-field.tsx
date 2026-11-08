import { Check, CircleAlert, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { get, useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getDefaultValues } from '@/lib/forms/build-form-schema';
import type { FormFieldDefinition } from '@/lib/forms/types';

import { FieldLabel } from './field-label';
import { FieldRenderer } from './field-renderer';

type GroupFieldDefinition = Extract<FormFieldDefinition, { _type: 'formFieldGroup' }>;

/** How many fields of an entry make up its summary. */
const SUMMARY_FIELD_COUNT = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/**
 * The one-line summary of a collapsed entry: what was typed into its first two text fields, which
 * name the entry in a sensible form ("Müller, Max"). The item label stands in while both are empty.
 *
 * @param field - The group.
 * @param entry - The values of the entry.
 * @returns The summary.
 */
function getSummary(field: GroupFieldDefinition, entry: unknown): string {
	const values = isRecord(entry) ? entry : {};
	const summary = field.fields
		.filter((subField) => subField._type === 'formFieldText')
		.slice(0, SUMMARY_FIELD_COUNT)
		.map((subField) => values[subField._key])
		.filter((value): value is string => typeof value === 'string' && value.trim() !== '')
		.map((value) => value.trim())
		.join(', ');
	return summary || field.itemLabel;
}

function getMessage(error: unknown): string | undefined {
	return isRecord(error) && typeof error.message === 'string' ? error.message : undefined;
}

/**
 * The message of the group as a whole, such as too few entries. The resolver puts it under `root`
 * once the group has registered entries, and on the group itself while it has none.
 *
 * @param error - What the form state holds for the group.
 * @returns The message, if there is one.
 */
function getGroupMessage(error: unknown): string | undefined {
	return getMessage(isRecord(error) ? error.root : undefined) ?? getMessage(error);
}

/**
 * One entry of the group as a card. Open, it shows the entry's fields under its number; collapsed,
 * it shows the summary and whether the entry still holds an error.
 *
 * @param props - The entry's props.
 * @param props.entry - The values of the entry.
 * @param props.field - The group.
 * @param props.hasError - Whether a field of the entry holds an error.
 * @param props.index - The position of the entry, counted from 0.
 * @param props.isOpen - Whether the card is open.
 * @param props.onOpenChange - Called when the trigger opens or closes the card.
 * @param props.onRemove - Called when the entry is to be removed.
 * @returns The card.
 */
function GroupEntry({
	entry,
	field,
	hasError,
	index,
	isOpen,
	onOpenChange,
	onRemove,
}: Readonly<GroupEntryProps>) {
	const title = `${field.itemLabel} ${index + 1}`;

	return (
		<li>
			<Collapsible
				className="rounded-md border border-input bg-background-high-contrast"
				onOpenChange={onOpenChange}
				open={isOpen}
			>
				<div className="flex items-center gap-2 py-1 pr-1 pl-4">
					<CollapsibleTrigger className="flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-2 text-left text-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
						{isOpen ? title : `${index + 1} · ${getSummary(field, entry)}`}
						{!isOpen && !hasError && <Check aria-hidden="true" className="size-5 shrink-0" />}
						{!isOpen && hasError && (
							<>
								<CircleAlert
									aria-hidden="true"
									className="size-5 shrink-0 text-destructive-foreground"
								/>{' '}
								<span className="sr-only">(fehlerhaft)</span>
							</>
						)}
					</CollapsibleTrigger>
					<button
						aria-label={`${title} entfernen`}
						className="grid size-11 shrink-0 cursor-pointer place-content-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
						onClick={onRemove}
						type="button"
					>
						<Trash2 aria-hidden="true" className="size-5" />
					</button>
				</div>
				{/* A group named after the entry, so its fields are not just one more "Nachname" */}
				<CollapsibleContent
					className="grid gap-6 px-4 pt-2 pb-4 md:grid-cols-2"
					render={<fieldset aria-label={title} />}
				>
					{field.fields.map((subField) => (
						<FieldRenderer
							field={subField}
							key={subField._key}
							name={`${field._key}.${index}.${subField._key}`}
						/>
					))}
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}

/**
 * A repeatable group: each entry is a card, and only the active one is open. The others collapse
 * to a line such as "1 · Müller, Max", with a check mark while they hold no error. A new entry
 * becomes the active one, and a failed submit opens the first entry with an error.
 *
 * @param props - The group's props.
 * @param props.field - The group as the form query projects it.
 * @returns The group as a fieldset.
 */
function GroupField({ field }: Readonly<GroupFieldProps>) {
	const { control } = useFormContext();
	const { append, fields: entries, remove } = useFieldArray({ control, name: field._key });
	const values: unknown = useWatch({ control, name: field._key });
	const { errors, submitCount } = useFormState({ control, name: field._key });
	const [activeIndex, setActiveIndex] = useState<number | null>(0);
	const [handledSubmitCount, setHandledSubmitCount] = useState(submitCount);
	const helpTextId = useId();
	const messageId = useId();

	const hasEntryError = (index: number) => isRecord(get(errors, `${field._key}.${index}`));

	// A failed submit opens the first entry with an error. Adjusted while rendering, the way React
	// derives state from a changed prop, so the entry is open in the same commit as its messages.
	if (submitCount !== handledSubmitCount) {
		setHandledSubmitCount(submitCount);
		const firstInvalid = entries
			.map((_entry, index) => index)
			.find((index) => hasEntryError(index));
		if (firstInvalid !== undefined) {
			setActiveIndex(firstInvalid);
		}
	}

	const message = getGroupMessage(get(errors, field._key));
	const describedBy = [field.helpText && helpTextId, message && messageId]
		.filter(Boolean)
		.join(' ');
	const canAdd = entries.length < (field.maxItems ?? Number.POSITIVE_INFINITY);

	const addEntry = () => {
		append(getDefaultValues(field.fields));
		setActiveIndex(entries.length);
	};

	const removeEntry = (index: number) => {
		remove(index);
		setActiveIndex((current) => {
			if (current === null || current < index) {
				return current;
			}
			return current === index ? null : current - 1;
		});
	};

	return (
		<fieldset aria-describedby={describedBy || undefined} className="grid gap-3 md:col-span-2">
			<legend
				className="mb-3 flex items-center gap-2 text-lg data-[error=true]:text-destructive-foreground md:text-2xl"
				data-error={Boolean(message)}
			>
				<FieldLabel isRequired={field.isRequired} label={field.label} isGroup />
			</legend>
			{field.helpText && (
				<p className="text-sm text-muted-foreground" id={helpTextId}>
					{field.helpText}
				</p>
			)}
			{entries.length > 0 && (
				<ul className="grid gap-2">
					{entries.map((entry, index) => (
						<GroupEntry
							entry={Array.isArray(values) ? values[index] : undefined}
							field={field}
							hasError={hasEntryError(index)}
							index={index}
							isOpen={activeIndex === index}
							key={entry.id}
							onOpenChange={(isOpen) => {
								setActiveIndex(isOpen ? index : null);
							}}
							onRemove={() => {
								removeEntry(index);
							}}
						/>
					))}
				</ul>
			)}
			{message && (
				<p className="px-3 text-sm text-destructive-foreground" id={messageId}>
					{message}
				</p>
			)}
			{canAdd && (
				<Button className="justify-self-start" onClick={addEntry} type="button" variant="ghost">
					{`+ ${field.itemLabel} hinzufügen`}
				</Button>
			)}
		</fieldset>
	);
}

interface GroupEntryProps {
	entry: unknown;
	field: GroupFieldDefinition;
	hasError: boolean;
	index: number;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onRemove: () => void;
}

interface GroupFieldProps {
	field: GroupFieldDefinition;
}

export { GroupField };
