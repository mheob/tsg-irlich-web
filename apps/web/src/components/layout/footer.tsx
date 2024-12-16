import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

import TSGLogo from '@/icons/logos/tsg-logo';
import { client } from '@/lib/sanity/client';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { getSocialMediaIcon } from '@/utils/icon';

import SocialMediaIcon from '../ui/social-media-icon';

const contact: {
	address: string;
	email: string;
	phone: string;
} = {
	address: 'Gotenstraße 20, 56567 Neuwied',
	email: 'info@tsg-irlich.de',
	phone: '+49 2631 76987',
};

const mainNavigation: { href: string; label: string }[] = [
	{ href: '/impressum', label: 'Impressum' },
	{ href: '/datenschutz', label: 'Datenschutz' },
];

const imprint: { href: string; label: string } = { href: '/impressum', label: 'Impressum' };

const privacy: { href: string; label: string } = { href: '/datenschutz', label: 'Datenschutz' };

const currentYear = new Date().getFullYear();

export default async function Footer() {
	const socialMedia = await client.fetch(socialMediaQuery);

	return (
		<footer className="bg-primary w-full text-white">
			<div className="container mx-auto px-5 pb-4 pt-16 md:pt-40">
				<div className="md:flex md:justify-between">
					<section className="flex flex-col items-center gap-5">
						<Link href="/">
							<TSGLogo className="h-32 w-auto" />
						</Link>

						<h2 className="text-xl md:text-4xl">Folge uns</h2>

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
							<a
								className="hover:text-secondary group flex flex-col items-start gap-4 md:items-center"
								href="#!"
							>
								<span
									aria-label={`Besuche uns im Pappelstadion: ${contact.address}`}
									className="group-hover:border-secondary rounded-full border border-white p-3 md:border-2"
								>
									<MapPin className="size-6 md:size-12" strokeWidth="1" />
								</span>
								<address>{contact.address}</address>
							</a>

							<a
								className="hover:text-secondary group flex flex-col items-start gap-4 md:items-center"
								href={`tel:${contact.phone}`}
							>
								<span
									aria-label={`Rufe uns an: ${contact.phone}`}
									className="group-hover:border-secondary rounded-full border border-white p-3 md:border-2"
								>
									<Phone className="size-6 md:size-12" strokeWidth="1" />
								</span>
								<address>{contact.phone}</address>
							</a>

							<a
								className="hover:text-secondary group flex flex-col items-start gap-4 md:items-center"
								href={`mailto:${contact.email}`}
							>
								<span
									aria-label={`Schreibe uns eine E-Mail: ${contact.email}`}
									className="group-hover:border-secondary rounded-full border border-white p-3 md:border-2"
								>
									<Mail className="size-6 md:size-12" strokeWidth="1" />
								</span>
								<address>{contact.email}</address>
							</a>
						</section>

						<nav className="flex flex-col gap-8 md:mt-12 md:flex-row md:justify-end md:gap-20">
							<div className="font-bold">LINKS:</div>
							<div className="flex flex-col gap-8 md:flex-row">
								{mainNavigation.map(({ href, label }) => (
									<Link className="hover:text-secondary" href={href} key={href}>
										{label}
									</Link>
								))}
							</div>
						</nav>
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
