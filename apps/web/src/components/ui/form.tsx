'use client';

import type * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { type ComponentPropsWithRef, createContext, useContext, useId, useMemo } from 'react';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

const Form = FormProvider;

interface FormItemContextValue {
	id: string;
}

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	const value = useMemo(() => ({ name: props.name }), [props.name]);

	return (
		<FormFieldContext.Provider value={value}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { formState, getFieldState } = useFormContext();

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

const FormItem = ({ className, ...props }: ComponentPropsWithRef<'div'>) => {
	const id = useId();
	const value = useMemo(() => ({ id }), [id]);

	return (
		<FormItemContext.Provider value={value}>
			<div className={cn('flex flex-col gap-3', className)} {...props} />
		</FormItemContext.Provider>
	);
};
FormItem.displayName = 'FormItem';

const FormLabel = ({ className, ...props }: ComponentPropsWithRef<typeof LabelPrimitive.Root>) => {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn({ 'text-destructive': error }, className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
};
FormLabel.displayName = 'FormLabel';

const FormControl = ({ ...props }: ComponentPropsWithRef<typeof Slot>) => {
	const { error, formDescriptionId, formItemId, formMessageId } = useFormField();

	return (
		<Slot
			aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
			aria-invalid={Boolean(error)}
			id={formItemId}
			{...props}
		/>
	);
};
FormControl.displayName = 'FormControl';

const FormDescription = ({ className, ...props }: ComponentPropsWithRef<'p'>) => {
	const { formDescriptionId } = useFormField();

	return (
		<p className={cn('text-muted-foreground px-3', className)} id={formDescriptionId} {...props} />
	);
};
FormDescription.displayName = 'FormDescription';

const FormMessage = ({ children, className, ...props }: ComponentPropsWithRef<'p'>) => {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : children;

	if (!body) {
		return null;
	}

	return (
		<p
			className={cn('text-destructive px-3 font-medium italic', className)}
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
};
FormMessage.displayName = 'FormMessage';

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};
