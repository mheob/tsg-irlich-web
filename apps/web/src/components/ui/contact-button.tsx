import { SiWhatsapp } from '@icons-pack/react-simple-icons';
import { Mail, Phone } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { ContactLink } from '../with-logic/contact-link';

type ContactButtonProps = ComponentPropsWithRef<'a'> &
	(
		| {
				email?: never;
				phone?: never;
				whatsapp?: string;
		  }
		| {
				email?: never;
				phone?: string;
				whatsapp?: never;
		  }
		| {
				email?: string;
				phone?: never;
				whatsapp?: never;
		  }
	);

export function ContactButton({ email, phone, whatsapp, ...props }: ContactButtonProps) {
	if (email)
		return (
			<ContactLink
				aria-label="E-Mail"
				className="text-primary hover:text-secondary"
				href={`mailto:${email}`}
				{...props}
			>
				<Mail aria-hidden="true" />
			</ContactLink>
		);

	if (phone) {
		return (
			<ContactLink
				aria-label="Telefon"
				className="text-primary hover:text-secondary"
				href={`tel:${phone.replaceAll(' ', '')}`}
				{...props}
			>
				<Phone aria-hidden="true" />
			</ContactLink>
		);
	}

	if (whatsapp) {
		return (
			<ContactLink
				aria-label="Whatsapp"
				className="text-primary hover:text-secondary"
				href={`https://wa.me/${whatsapp.replace(/^\+/, '').replaceAll(' ', '')}`}
				{...props}
			>
				<SiWhatsapp aria-hidden="true" />
			</ContactLink>
		);
	}

	return null;
}
