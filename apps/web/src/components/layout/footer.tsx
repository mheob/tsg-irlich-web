import { cn } from '@tsgi-web/shared';
import { ArrowUp, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

import TSGLogo from '@/icons/logos/tsg-logo';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import type { TrainingTimeSection } from '@/types/sanity.types';
import { getSocialMediaIcon } from '@/utils/icon';
import { printGoogleMapsLink } from '@/utils/url';

import { buttonVariants } from '../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import { ExternalLink } from '../ui/external-link';
import { SocialMediaIcon } from '../ui/social-media-icon';
import { ContactLink } from '../with-logic/contact-link';

const contact: {
	address: Parameters<typeof printGoogleMapsLink>[number];
	email: string;
} = {
	address: {
		city: 'Neuwied',
		houseNumber: '20',
		name: 'TSG Irlich',
		street: 'Gotenstraße',
		zipCode: '56567',
	},
	email: 'info@tsg-irlich.de',
};

const simplifiedAddress = `${contact.address.street} ${contact.address.houseNumber}, ${contact.address.zipCode} ${contact.address.city}`;

const imprint: { href: string; label: string } = { href: '/impressum', label: 'Impressum' };

const privacy: { href: string; label: string } = { href: '/datenschutz', label: 'Datenschutz' };

const currentYear = new Date().getFullYear();

export default async function Footer() {
	const socialMedia = await client.fetch(socialMediaQuery);

	return (
		<footer className="bg-primary w-full text-white">
			<div className="container mx-auto px-5 pt-16 pb-4 md:pt-40">
				<div className="md:flex md:justify-between">
					<section className="flex flex-col items-center gap-5">
						<Link href="/">
							<TSGLogo className="h-32 w-auto" />
						</Link>

						<h2 className="mt-7 text-xl md:text-4xl">Folge uns</h2>

						<div className="flex gap-8 md:gap-4">
							{socialMedia &&
								Object.entries(socialMedia).map(([name, url]) => (
									<SocialMediaIcon
										href={url}
										icon={getSocialMediaIcon(name)}
										key={url}
										label={name}
									/>
								))}
						</div>
					</section>

					<div className="mt-16 flex gap-8 md:mt-0 md:block md:text-xl/relaxed">
						<section className="flex flex-col gap-12 md:w-auto md:flex-row md:gap-48">
							{/* TODO: open modal with multiple links to several map providers */}
							<Dialog>
								<DialogTrigger className="hover:text-secondary group flex cursor-pointer flex-col items-start gap-4 transition-colors md:items-center">
									<span
										aria-label={`Besuche uns im Pappelstadion: ${contact.address}`}
										className="group-hover:border-secondary rounded-full border border-white p-3 transition-colors md:border-2"
									>
										<MapPin className="size-6 md:size-12" strokeWidth="1" />
									</span>
									<address>{simplifiedAddress}</address>
								</DialogTrigger>
								<DialogContent>
									<DialogTitle className="text-lg tracking-normal md:text-2xl">
										Achtung: Du wechselst zu Google Maps
									</DialogTitle>
									<DialogDescription>
										<p className="my-4 text-lg">
											Du wechselst zu Google Maps, um unseren Standort zu sehen und die Route zu uns
											zu berechnen.
										</p>
									</DialogDescription>
									<DialogFooter>
										<ExternalLink
											className={cn(buttonVariants(), 'btn--primary')}
											href={printGoogleMapsLink(contact.address)}
										>
											<span>Google Maps öffnen</span>
										</ExternalLink>
									</DialogFooter>
								</DialogContent>
							</Dialog>

							<ContactLink
								className="hover:text-secondary group flex flex-col items-start gap-4 transition-colors md:items-center"
								href={`mailto:${contact.email}`}
							>
								<span
									aria-label={`Schreibe uns eine E-Mail: ${contact.email}`}
									className="group-hover:border-secondary rounded-full border border-white p-3 transition-colors md:border-2"
								>
									<Mail className="size-6 md:size-12" strokeWidth="1" />
								</span>
								<address>{contact.email}</address>
							</ContactLink>
						</section>
					</div>
				</div>

				<section className="mt-12 flex flex-col-reverse items-center gap-4 md:flex-row md:justify-between">
					<div className="mt-4 md:mt-0">©{currentYear} TSG Irlich. Alle Rechte vorbehalten.</div>
					<nav className="flex items-center gap-4">
						<a className="hover:text-secondary" href={imprint?.href}>
							{imprint?.label}
						</a>{' '}
						|
						<a className="hover:text-secondary" href={privacy?.href}>
							{privacy?.label}
						</a>
						<a
							aria-label="zum Seitenanfang springen"
							className="bg-secondary hover:bg-secondary/80 ml-4 rounded-full p-1.5"
							href="#top"
						>
							<ArrowUp className="text-primary bg-transparent" size="32" strokeWidth="2" />
						</a>
					</nav>
				</section>
			</div>
		</footer>
	);
}
