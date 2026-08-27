'use client';

import type { ComponentProps } from 'react';
import { useRef } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { ExternalLink } from '@/components/ui/external-link';
import { printGoogleMapsLink } from '@/utils/url';

import type { DialogActions } from '../ui/dialog';
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';

function GoToGoogleMaps({ address, children, ...props }: Readonly<GoToGoogleMapsProps>) {
	// The Google Maps link has to stay a link, so it cannot be a `DialogClose`: Base UI puts button
	// semantics on whatever a `Close` renders as. It closes the dialog through the root's imperative
	// handle instead.
	const dialogActions = useRef<DialogActions>(null);

	const closeDialog = () => {
		dialogActions.current?.close();
	};

	return (
		<Dialog actionsRef={dialogActions}>
			<DialogTrigger {...props}>{children}</DialogTrigger>
			<DialogPopup>
				<DialogTitle className="text-lg tracking-normal md:text-2xl">
					Achtung: Du wechselst zu Google Maps
				</DialogTitle>
				<DialogDescription className="my-4 text-lg">
					Du wechselst zu Google Maps, um unseren Standort zu sehen und die Route zu uns zu
					berechnen.
				</DialogDescription>
				<DialogFooter>
					<DialogClose render={<Button variant="ghost" />}>Hier bleiben</DialogClose>
					<ButtonLink
						render={<ExternalLink href={printGoogleMapsLink(address)} onClick={closeDialog} />}
					>
						Google Maps öffnen
					</ButtonLink>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}

interface GoToGoogleMapsProps extends ComponentProps<typeof DialogTrigger> {
	address: Parameters<typeof printGoogleMapsLink>[number];
}

export { GoToGoogleMaps };
