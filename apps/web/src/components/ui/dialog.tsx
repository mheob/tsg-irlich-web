// oxlint-disable import/no-namespace

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, RefObject } from 'react';

import { cn } from '@tsgi-web/shared';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Overlay> | null>;
}) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				'fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}

function DialogContent({
	children,
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Content> | null>;
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					'fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=open]:zoom-in-95 sm:rounded-lg',
					className,
				)}
				ref={ref}
				{...props}
			>
				{children}
				<DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
					<X className="size-8 text-primary" />
					<span className="sr-only">Schließen</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Title> | null>;
}) {
	return (
		<DialogPrimitive.Title
			className={cn('text-lg leading-none font-semibold tracking-tight', className)}
			ref={ref}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
	ref?: RefObject<ComponentRef<typeof DialogPrimitive.Description> | null>;
}) {
	return (
		<DialogPrimitive.Description
			className={cn('text-sm text-muted-foreground', className)}
			ref={ref}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogTrigger,
	DialogPortal,
	DialogClose,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
