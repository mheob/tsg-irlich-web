import { useId } from 'react';
import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { PortableText } from '@/components/ui/portable-text';
import type { AnyFormField } from '@/lib/forms/types';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { FieldLabel } from './field-label';

type ConsentFieldDefinition = Extract<AnyFormField, { _type: 'formFieldConsent' }>;

/**
 * A checkbox the visitor has to tick, labelled by the editor's text, whose links stay links. Wired
 * like `PrivacyField`: Base UI's checkbox is no labelable element, so it is named through
 * `aria-labelledby`. A consent is always mandatory, whatever `isRequired` says.
 *
 * @param props - The field's props.
 * @param props.field - The consent as the form query projects it.
 * @param props.name - The path of the value in the form, the field's `_key` or one inside a group entry.
 * @param props.wrapperClassName - Classes for the field's wrapper, such as its width.
 * @returns The consent.
 */
function ConsentField({ field, name, wrapperClassName }: Readonly<ConsentFieldProps>) {
	const { control } = useFormContext();
	const labelId = useId();
	const textId = useId();
	// A draft in the preview may still lack its text.
	const blocks = field.text?.text ?? [];

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: controller }) => (
				<FormItem className={wrapperClassName}>
					<FormLabel id={labelId}>
						<FieldLabel label={field.label} isRequired />
					</FormLabel>
					{/* The label makes the text toggle the checkbox; a click on a link inside it still only
					    follows the link. Base UI's `Checkbox` is the control, the rule only knows native ones */}
					{/* oxlint-disable-next-line jsx-a11y/label-has-associated-control */}
					<label className="flex max-w-full cursor-pointer gap-2">
						<FormControl>
							<Checkbox
								aria-labelledby={blocks.length > 0 ? textId : labelId}
								aria-required="true"
								checked={controller.value === true}
								className="mt-1"
								// oxlint-disable-next-line react/jsx-handler-names
								onBlur={controller.onBlur}
								// oxlint-disable-next-line react/jsx-handler-names
								onCheckedChange={controller.onChange}
								ref={controller.ref}
							/>
						</FormControl>
						<div className="text-muted-foreground" id={textId}>
							<PortableText value={blocks} />
						</div>
					</label>
					{field.helpText && <FormDescription>{field.helpText}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

interface ConsentFieldProps {
	field: ConsentFieldDefinition;
	name: string;
	wrapperClassName?: string;
}

export { ConsentField };
