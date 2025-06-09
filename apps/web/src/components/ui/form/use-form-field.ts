import { use } from 'react';
import { type FieldError, useFormContext, useFormState } from 'react-hook-form';

import { FormFieldContext, FormItemContext } from './form-context';

export const useFormField = (): {
	error?: FieldError;
	formDescriptionId: string;
	formItemId: string;
	formMessageId: string;
	id: string;
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

	const { id } = itemContext;

	return {
		formDescriptionId: `${id}-form-item-description`,
		formItemId: `${id}-form-item`,
		formMessageId: `${id}-form-item-message`,
		id,
		name: fieldContext.name,
		...fieldState,
	};
};
