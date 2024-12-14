import { Mail, Phone } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

type ContactButtonProps = ComponentPropsWithRef<'a'> &
	(
		| {
				email?: never;
				phone?: string;
		  }
		| {
				email?: string;
				phone?: never;
		  }
	);

export default function ContactButton({ email, phone, ...props }: ContactButtonProps) {
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
				href={`tel:${phone}`}
				{...props}
			>
				<Phone aria-hidden="true" />
			</a>
		);
	}

	return null;
}
