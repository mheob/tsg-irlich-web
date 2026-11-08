import type { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';

import { InputWithLabel } from '@/components/ui/input';
import { PortableText } from '@/components/ui/portable-text';
import { TextareaWithLabel } from '@/components/ui/textarea';
import type { AnyFormField } from '@/lib/forms/types';

import { FormField } from '../form';
import { ChoiceField } from './choice-field';
import { ConsentField } from './consent-field';
import { FieldLabel } from './field-label';

/** Every field but a group: what a group entry holds, and what the form renders outside of groups. */
type RenderableField = Exclude<AnyFormField, { _type: 'formFieldGroup' }>;

type InputField = Extract<
	RenderableField,
	{
		_type:
			| 'formFieldDate'
			| 'formFieldEmail'
			| 'formFieldNumber'
			| 'formFieldPhone'
			| 'formFieldText';
	}
>;

type NoteFieldDefinition = Extract<RenderableField, { _type: 'formFieldNote' }>;

/** The input attributes of each single-line type; email and phone let the browser fill them in. */
const INPUT_ATTRIBUTES: Readonly<Record<InputField['_type'], ComponentProps<'input'>>> = {
	formFieldDate: { type: 'date' },
	formFieldEmail: { autoComplete: 'email', type: 'email' },
	// Numbers stay strings, as the schema checks them; a numeric keyboard is all the help needed.
	formFieldNumber: { inputMode: 'numeric', type: 'text' },
	formFieldPhone: { autoComplete: 'tel', type: 'tel' },
	formFieldText: { type: 'text' },
};

/**
 * A note between the fields. Its title is an `h2`: the form has no heading of its own and sits next
 * to the page's information column, whose title only shows from `lg` up, so below that an `h3`
 * would follow the page's `h1` directly.
 *
 * @param props - The note's props.
 * @param props.field - The note.
 * @returns The title and the text, either of them only when the editor filled it in.
 */
function NoteField({ field }: Readonly<{ field: NoteFieldDefinition }>) {
	return (
		<div className="grid gap-2 md:col-span-2">
			{field.title && <h2 className="text-2xl md:text-3xl">{field.title}</h2>}
			{field.text && <PortableText value={field.text.text} />}
		</div>
	);
}

/**
 * A single-line input: text, email, phone, number or date.
 *
 * @param props - The field's props.
 * @param props.field - The field.
 * @param props.name - The path of the value in the form.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The labelled input.
 */
function TextField({ field, name, wrapperClassName }: Readonly<FieldProps<InputField>>) {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: controller }) => (
				<InputWithLabel
					{...INPUT_ATTRIBUTES[field._type]}
					aria-required={field.isRequired ? 'true' : undefined}
					description={field.helpText}
					field={controller}
					maxLength={field.maxLength ?? undefined}
					wrapperClassName={wrapperClassName}
				>
					<FieldLabel isRequired={field.isRequired} label={field.label} />
				</InputWithLabel>
			)}
		/>
	);
}

/**
 * A multi-line input.
 *
 * @param props - The field's props.
 * @param props.field - The field.
 * @param props.name - The path of the value in the form.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The labelled textarea.
 */
function TextareaField({
	field,
	name,
	wrapperClassName,
}: Readonly<FieldProps<Extract<RenderableField, { _type: 'formFieldTextarea' }>>>) {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: controller }) => (
				<TextareaWithLabel
					aria-required={field.isRequired ? 'true' : undefined}
					description={field.helpText}
					field={controller}
					maxLength={field.maxLength ?? undefined}
					wrapperClassName={wrapperClassName}
				>
					<FieldLabel isRequired={field.isRequired} label={field.label} />
				</TextareaWithLabel>
			)}
		/>
	);
}

/**
 * Renders one field of a form, or of a group entry, by its type. A field of half width shares its
 * row with the next one from `md` up; every other field spans both columns of the form's grid.
 *
 * @param props - The renderer's props.
 * @param props.field - Any field but a group.
 * @param props.name - The path of the value in the form, the field's `_key` or one inside a group entry.
 * @returns The field.
 */
function FieldRenderer({ field, name }: Readonly<FieldRendererProps>) {
	const wrapperClassName = field.width === 'half' ? undefined : 'md:col-span-2';

	if (field._type === 'formFieldNote') {
		return <NoteField field={field} />;
	}
	if (field._type === 'formFieldConsent') {
		return <ConsentField field={field} name={name} wrapperClassName={wrapperClassName} />;
	}
	if (field._type === 'formFieldChoice') {
		return <ChoiceField field={field} name={name} wrapperClassName={wrapperClassName} />;
	}
	if (field._type === 'formFieldTextarea') {
		return <TextareaField field={field} name={name} wrapperClassName={wrapperClassName} />;
	}
	return <TextField field={field} name={name} wrapperClassName={wrapperClassName} />;
}

interface FieldProps<Field> {
	field: Field;
	name: string;
	wrapperClassName?: string;
}

interface FieldRendererProps {
	field: RenderableField;
	name: string;
}

export { FieldRenderer };
