import { use } from 'react';
import { type FieldError, useFormContext, useFormState } from 'react-hook-form';

import { FormFieldContext, FormItemContext } from './form-context';

export const useFormField = (): {
	id: string;
	error?: FieldError;
	formDescriptionId: string;
	formItemId: string;
	formMessageId: string;
	invalid: boolean;
	isDirty: boolean;
	isTouched: boolean;
	isValidating: boolean;
	name: string;
} => {
	const fieldContext = use(FormFieldContext);
	const itemContext = use(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error('useFormField should be used within <FormField>');
	}

	if (!itemContext) {
		throw new Error('useFormField should be used within <FormItem>');
	}

	const { id } = itemContext;

	return {
		id,
		formDescriptionId: `${id}-form-item-description`,
		formItemId: `${id}-form-item`,
		formMessageId: `${id}-form-item-message`,
		name: fieldContext.name,
		...fieldState,
	};
};
