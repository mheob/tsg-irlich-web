'use client';

import type { ComponentProps } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { ExternalLink } from '@/components/ui/external-link';
import { printGoogleMapsLink } from '@/utils/url';

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';

interface GoToGoogleMapsProps extends ComponentProps<typeof DialogTrigger> {
	address: Parameters<typeof printGoogleMapsLink>[number];
}

export function GoToGoogleMaps({ address, children, ...props }: Readonly<GoToGoogleMapsProps>) {
	return (
		<Dialog>
			<DialogTrigger {...props}>{children}</DialogTrigger>
			<DialogContent>
				<DialogTitle className="text-lg tracking-normal md:text-2xl">
					Achtung: Du wechselst zu Google Maps
				</DialogTitle>
				<DialogDescription className="my-4 text-lg">
					Du wechselst zu Google Maps, um unseren Standort zu sehen und die Route zu uns zu
					berechnen.
				</DialogDescription>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="ghost">Hier bleiben</Button>
					</DialogClose>
					<DialogClose asChild>
						<ExternalLink className={buttonVariants()} href={printGoogleMapsLink(address)}>
							<span>Google Maps öffnen</span>
						</ExternalLink>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
