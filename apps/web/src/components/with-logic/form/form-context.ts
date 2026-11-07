import { createContext } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

interface FormItemContextValue {
	/** Whether a `FormDescription` is mounted in the item, so `FormControl` may point at it. */
	hasDescription: boolean;
	id: string;
	/** Called by `FormDescription` when it mounts and unmounts. */
	setHasDescription: (hasDescription: boolean) => void;
}

interface FormFieldContextValue {
	name: FieldPath<FieldValues>;
}

const FormItemContext = createContext<FormItemContextValue | null>(null);

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export { FormItemContext, FormFieldContext };
export type { FormItemContextValue, FormFieldContextValue };
