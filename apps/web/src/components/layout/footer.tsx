import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

import { socialMedia } from '@/data/social-media';
import TSGLogo from '@/icons/logos/tsg-logo';

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

export default function Footer() {
	return (
		<footer className="bg-primary text-white">
			<div className="container mx-auto px-5 pb-4 pt-40">
				<div className="flex justify-between">
					<section className="flex flex-col items-center gap-5">
						<TSGLogo className="h-32 w-auto" />

						<h2 className="text-4xl">Folge uns</h2>

						<div className="flex gap-4">
							{socialMedia.map(({ href, icon: Icon, label }) => (
								<Link
									aria-label={label}
									className="hover:text-secondary"
									href={href}
									key={href}
									rel="noopener noreferrer"
									target="_blank"
								>
									<Icon size="32" />
								</Link>
							))}
						</div>
					</section>

					<div className="text-xl/relaxed">
						<section className="flex gap-48">
							<a className="hover:text-secondary flex flex-col items-center gap-4" href="#!">
								<span className="rounded-full border p-3">
									<MapPin size="48" strokeWidth="1" />
								</span>
								<address>{contact.address}</address>
							</a>

							<a
								className="hover:text-secondary flex flex-col items-center gap-4"
								href={`tel:${contact.phone}`}
							>
								<span className="rounded-full border p-3">
									<Phone size="48" strokeWidth="1" />
								</span>
								<address>{contact.phone}</address>
							</a>

							<a
								className="hover:text-secondary flex flex-col items-center gap-4"
								href={`mailto:${contact.email}`}
							>
								<span className="rounded-full border p-3">
									<Mail size="48" strokeWidth="1" />
								</span>
								<address>{contact.email}</address>
							</a>
						</section>

						<nav className="mt-12 flex items-center justify-end gap-20">
							<div className="font-bold">LINKS:</div>
							<div className="flex gap-8">
								{mainNavigation.map(({ href, label }) => (
									<Link className="hover:text-secondary" href={href} key={href}>
										{label}
									</Link>
								))}
							</div>
						</nav>
					</div>
				</div>

				<section className="mt-12 flex justify-between">
					<div>©{currentYear} TSG Irlich. Alle Rechte vorbehalten.</div>
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
