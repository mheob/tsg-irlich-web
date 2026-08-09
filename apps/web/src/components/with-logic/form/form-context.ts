import { createContext } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

interface FormItemContextValue {
	id: string;
}

interface FormFieldContextValue {
	name: FieldPath<FieldValues>;
}

const FormItemContext = createContext<FormItemContextValue | null>(null);

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export { FormItemContext, FormFieldContext };
export type { FormItemContextValue, FormFieldContextValue };
