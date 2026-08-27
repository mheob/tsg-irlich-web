import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { ComponentProps, HTMLAttributes } from 'react';

import { cn } from '@tsgi-web/shared';

const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogPortal = BaseDialog.Portal;
const DialogClose = BaseDialog.Close;

function DialogBackdrop({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
	return (
		<BaseDialog.Backdrop
			className={cn(
				'fixed inset-0 z-50 bg-black/80 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0',
				className,
			)}
			{...props}
		/>
	);
}

function DialogPopup({ children, className, ...props }: ComponentProps<typeof BaseDialog.Popup>) {
	return (
		<DialogPortal>
			<DialogBackdrop />
			<BaseDialog.Popup
				className={cn(
					'fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:rounded-lg',
					className,
				)}
				{...props}
			>
				{children}
				<BaseDialog.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-open:bg-accent data-open:text-muted-foreground">
					<X className="size-8 text-primary" />
					<span className="sr-only">Schließen</span>
				</BaseDialog.Close>
			</BaseDialog.Popup>
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

function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
	return (
		<BaseDialog.Title
			className={cn('text-lg leading-none font-semibold tracking-tight', className)}
			{...props}
		/>
	);
}

function DialogDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
	return (
		<BaseDialog.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
	);
}

export type DialogActions = BaseDialog.Root.Actions;

export {
	Dialog,
	DialogTrigger,
	DialogPortal,
	DialogClose,
	DialogBackdrop,
	DialogPopup,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
