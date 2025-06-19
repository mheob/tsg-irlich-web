import { SiWhatsapp } from '@icons-pack/react-simple-icons';
import { Mail, Phone } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

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
			<a
				aria-label="E-Mail"
				className="text-primary hover:text-secondary"
				href={`mailto:${email}`}
				{...props}
			>
				<Mail aria-hidden="true" />
			</a>
		);

	if (phone) {
		return (
			<a
				aria-label="Telefon"
				className="text-primary hover:text-secondary"
				href={`tel:${phone.replaceAll(' ', '')}`}
				{...props}
			>
				<Phone aria-hidden="true" />
			</a>
		);
	}

	if (whatsapp) {
		return (
			<a
				aria-label="Whatsapp"
				className="text-primary hover:text-secondary"
				href={`https://wa.me/${whatsapp.slice(1).replaceAll(' ', '')}`}
				{...props}
			>
				<SiWhatsapp aria-hidden="true" />
			</a>
		);
	}

	return null;
}
