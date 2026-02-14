import { TSGLogo } from '@tsgi-web/shared';
import { ArrowUp, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

import { GoToGoogleMaps } from '@/components/section/go-to-google-maps';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { getSocialMediaIcon } from '@/utils/icon';
import type { printGoogleMapsLink } from '@/utils/url';

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

const imprint: { href: string; label: string } = { href: '/impressum', label: 'Impressum' };
const privacy: { href: string; label: string } = { href: '/datenschutz', label: 'Datenschutz' };
const accessibility: { href: string; label: string } = {
	href: '/barrierefreiheit',
	label: 'Barrierefreiheit',
};
const currentYear = new Date().getFullYear();

export default async function Footer() {
	const socialMedia = await client.fetch(socialMediaQuery);

	const simplifiedAddress = `${contact.address.street} ${contact.address.houseNumber}, ${contact.address.zipCode} ${contact.address.city}`;

	return (
		<footer className="bg-primary w-full text-white">
			<div className="container pt-16 pb-4 md:pt-40">
				<div className="md:flex md:justify-between">
					<section className="flex flex-col items-center gap-5">
						<Link href="/" title="Zur Startseite wechseln">
							<TSGLogo className="h-32 w-auto" />
						</Link>

						<h2 className="mt-7 text-xl md:text-4xl">Folge uns</h2>

						<div className="flex gap-8 md:gap-4">
							{socialMedia &&
								Object.entries(socialMedia).map(([name, url]) => (
									<SocialMediaIcon
										className="size-6 md:size-8"
										href={url}
										icon={getSocialMediaIcon(name)}
										key={url}
										label={name}
									/>
								))}
						</div>
					</section>

					<div className="mt-16 flex justify-center gap-8 md:mt-0 md:block md:text-xl/relaxed">
						<section className="flex flex-col items-center gap-12 sm:w-auto sm:flex-row sm:gap-48">
							<GoToGoogleMaps
								address={contact.address}
								className="hover:text-secondary group flex cursor-pointer items-center gap-4 transition-colors sm:flex-col"
							>
								<span className="group-hover:border-secondary rounded-full border border-white p-3 transition-colors md:border-2">
									<MapPin
										aria-label={`Besuche uns im Pappelstadion: ${simplifiedAddress}`}
										className="size-6 md:size-12"
										strokeWidth="1"
									/>
								</span>
								<address>{simplifiedAddress}</address>
							</GoToGoogleMaps>

							<ContactLink
								className="hover:text-secondary group flex items-center gap-4 transition-colors sm:flex-col"
								href={`mailto:${contact.email}`}
							>
								<span className="group-hover:border-secondary rounded-full border border-white p-3 transition-colors md:border-2">
									<Mail
										aria-label={`Schreibe uns eine E-Mail: ${contact.email}`}
										className="size-6 md:size-12"
										strokeWidth="1"
									/>
								</span>
								<address>{contact.email}</address>
							</ContactLink>
						</section>
					</div>
				</div>

				<section className="mt-12 flex flex-col-reverse items-center gap-4 md:flex-row md:justify-between">
					<div className="mt-4 md:mt-0">
						©{currentYear} TSG Irlich. Alle Rechte vorbehalten. |{' '}
						<Link className="text-secondary font-bold hover:text-white" href="/kontakt/feedback">
							Feedback geben
						</Link>
					</div>
					<nav className="flex items-center gap-4">
						<Link className="hover:text-secondary" href={imprint?.href}>
							{imprint?.label}
						</Link>{' '}
						|
						<Link className="hover:text-secondary" href={privacy?.href}>
							{privacy?.label}
						</Link>{' '}
						|
						<Link className="hover:text-secondary" href={accessibility?.href}>
							{accessibility?.label}
						</Link>
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
