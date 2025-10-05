'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@tsgi-web/shared';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, RefObject } from 'react';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({
	className,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Overlay> | null>;
}) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
				className,
			)}
			{...props}
		/>
	);
}

export function DialogContent({
	children,
	className,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Content> | null>;
}) {
	return (
		<DialogPortal>
			<DialogOverlay className="cursor-pointer" />
			<DialogPrimitive.Content
				className={cn(
					'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
					className,
				)}
				{...props}
			>
				{children}
				<DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute -top-20 right-10 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
					<X className="text-secondary size-12" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

export function DialogHeader({ className, ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
	return (
		<div
			className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
			{...props}
		/>
	);
}

export function DialogFooter({ className, ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
	return (
		<div
			className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
			{...props}
		/>
	);
}

export function DialogTitle({
	className,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Title> | null>;
}) {
	return (
		<DialogPrimitive.Title
			className={cn('text-lg font-semibold leading-none tracking-tight', className)}
			{...props}
		/>
	);
}

export function DialogDescription({
	className,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Description> | null>;
}) {
	return (
		<DialogPrimitive.Description
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	);
}
