import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { SelectWithLabel } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AnyFormField } from '@/lib/forms/types';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { FieldLabel } from './field-label';

type ChoiceFieldDefinition = Extract<AnyFormField, { _type: 'formFieldChoice' }>;

type Controller = ControllerRenderProps<FieldValues, string>;

function toSelected(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}
	return typeof value === 'string' && value !== '' ? [value] : [];
}

/**
 * A single choice as a select, labelled like every other field.
 *
 * @param props - The choice's props.
 * @param props.controller - What react-hook-form hands the field.
 * @param props.field - The choice.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The select.
 */
function SelectChoice({ controller, field, wrapperClassName }: Readonly<ChoiceProps>) {
	const [selected = null] = toSelected(controller.value);

	return (
		<SelectWithLabel
			description={field.helpText}
			field={{ ...controller, value: selected }}
			onValueChange={(value) => {
				controller.onChange(typeof value === 'string' ? value : '');
			}}
			placeholder="Bitte wählen"
			required={field.isRequired ?? false}
			selectItems={field.options.map((option) => ({ label: option, value: option }))}
			wrapperClassName={wrapperClassName}
		>
			<FieldLabel isRequired={field.isRequired} label={field.label} />
		</SelectWithLabel>
	);
}

/**
 * The buttons or checkboxes of a choice. They form a group named by the label, which therefore
 * points at no control (`htmlFor` unset); the first option takes the ref, so a failed submit can
 * move the focus there.
 *
 * @param props - The choice's props.
 * @param props.controller - What react-hook-form hands the field.
 * @param props.field - The choice.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The group of buttons or checkboxes.
 */
function GroupChoice({ controller, field, wrapperClassName }: Readonly<ChoiceProps>) {
	const labelId = useId();
	const selected = toSelected(controller.value);

	return (
		<FormItem className={wrapperClassName}>
			<FormLabel htmlFor={undefined} id={labelId}>
				<FieldLabel isRequired={field.isRequired} label={field.label} isGroup />
			</FormLabel>
			<FormControl>
				{field.isMultiple ? (
					<CheckboxGroup
						aria-labelledby={labelId}
						className="flex flex-wrap gap-x-6 gap-y-3"
						// oxlint-disable-next-line react/jsx-handler-names
						onValueChange={controller.onChange}
						value={selected}
					>
						{field.options.map((option, index) => (
							// The label makes the option's text toggle its checkbox.
							<label className="flex cursor-pointer items-center gap-2" key={option}>
								<Checkbox
									aria-labelledby={`${labelId}-${index}`}
									ref={index === 0 ? controller.ref : undefined}
									value={option}
								/>
								<span id={`${labelId}-${index}`}>{option}</span>
							</label>
						))}
					</CheckboxGroup>
				) : (
					<ToggleGroup
						aria-labelledby={labelId}
						className="flex-wrap justify-start"
						onValueChange={(value) => {
							controller.onChange(value[0] ?? '');
						}}
						value={selected}
						variant="outline"
					>
						{field.options.map((option, index) => (
							<ToggleGroupItem
								className="px-4"
								key={option}
								ref={index === 0 ? controller.ref : undefined}
								value={option}
							>
								{option}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				)}
			</FormControl>
			{field.helpText && <FormDescription>{field.helpText}</FormDescription>}
			<FormMessage />
		</FormItem>
	);
}

/**
 * A choice between the editor's options: a select for a single choice displayed as one, buttons
 * for any other single choice, checkboxes for a multiple one.
 *
 * @param props - The field's props.
 * @param props.field - The choice as the form query projects it.
 * @param props.name - The path of the value in the form, the field's `_key` or one inside a group entry.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The choice.
 */
function ChoiceField({ field, name, wrapperClassName }: Readonly<ChoiceFieldProps>) {
	const { control } = useFormContext();
	const isSelect = !field.isMultiple && field.display === 'select';

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: controller }) =>
				isSelect ? (
					<SelectChoice controller={controller} field={field} wrapperClassName={wrapperClassName} />
				) : (
					<GroupChoice controller={controller} field={field} wrapperClassName={wrapperClassName} />
				)
			}
		/>
	);
}

interface ChoiceFieldProps {
	field: ChoiceFieldDefinition;
	name: string;
	wrapperClassName?: string;
}

interface ChoiceProps {
	controller: Controller;
	field: ChoiceFieldDefinition;
	wrapperClassName?: string;
}

export { ChoiceField };
