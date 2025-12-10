'use client';

import { MapPin } from 'lucide-react';

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
} from '../../ui/dialog';

interface AddressPinProps {
	address: Parameters<typeof printGoogleMapsLink>[number];
}

export function AddressPin({ address }: Readonly<AddressPinProps>) {
	const simplifiedAddress = `${address.street} ${address.houseNumber}, ${address.zipCode} ${address.city}`;

	return (
		<Dialog>
			<DialogTrigger
				aria-label={`Besuche uns im Pappelstadion: ${simplifiedAddress}`}
				className="hover:text-secondary group flex cursor-pointer items-center gap-4 transition-colors sm:flex-col"
			>
				<span className="group-hover:border-secondary rounded-full border border-white p-3 transition-colors md:border-2">
					<MapPin className="size-6 md:size-12" strokeWidth="1" />
				</span>
				<address>{simplifiedAddress}</address>
			</DialogTrigger>
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
					<ExternalLink className={buttonVariants()} href={printGoogleMapsLink(address)}>
						<span>Google Maps öffnen</span>
					</ExternalLink>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
