import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';

import { tailwindConfig } from '../tailwind-config';

function linkWithoutProtocol(url: string) {
	return url.replace(/^https?:\/\//, '');
}

interface ContactForwardEmailProps {
	baseUrl: string;
	contactEmail: string;
	contactMessage: string;
	contactName: string;
	receiver?: string;
}

export function ContactForwardEmail({
	baseUrl = 'https://next.tsg-irlich.de',
	contactEmail = 'info@tsg-irlich.de',
	contactMessage = 'Hallo liebes Team von der TSG Irlich! Ich wende mich folgendem Anliegen an euch...',
	contactName = 'Max Mustermann',
	receiver,
}: Readonly<ContactForwardEmailProps>) {
	return (
		<Html>
			<Head />

			<Tailwind config={tailwindConfig}>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{`Von ${baseUrl} kommt eine Anfrage von ${contactName}.`}</Preview>

					<Container className="border-border mx-auto my-10 max-w-2xl rounded border border-solid p-5">
						<Section className="mt-[32px] flex justify-center">
							<Img
								alt="TSG Irlich Logo"
								height="128"
								src={`${baseUrl}/tsg-irlich-logo.png`}
								width="171"
							/>
						</Section>

						<Heading className="my-[30px] text-center text-2xl text-black">
							Neue Nachricht über{' '}
							<Link className="text-primary" href={baseUrl}>
								{linkWithoutProtocol(baseUrl)}
							</Link>
							!
						</Heading>

						<Section>
							{receiver ? (
								<Text className="text-base">
									Hi! Es gibt eine Anfrage, die in deine Zuständigkeit ({receiver}) fällt.
								</Text>
							) : (
								<Text className="text-base">Hi! Es gibt eine neue, allgemeine Anfrage.</Text>
							)}
							<Text className="text-base">
								<strong>{contactName}</strong> &lt;
								<Link className="text-primary" href={`mailto:${contactEmail}`}>
									{contactEmail}
								</Link>
								&gt; hat dir eine Nachricht gesendet:
							</Text>

							<Text className="bg-background-high-contrast rounded-xl p-4 text-base whitespace-pre-line italic">
								{contactMessage}
							</Text>
						</Section>

						<Hr />

						<Text className="text-sm">
							Du kannst <strong>{contactName}</strong> direkt über die Antwortfunktion deines
							Mail-Clients antworten.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

export default ContactForwardEmail;
