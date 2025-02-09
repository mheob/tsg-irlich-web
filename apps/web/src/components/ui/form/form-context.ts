import { createContext } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

interface FormItemContextValue {
	id: string;
}

export const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

export const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);
