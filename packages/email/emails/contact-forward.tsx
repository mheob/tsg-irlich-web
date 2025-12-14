import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';
import { TSGLogo } from '@tsgi-web/shared';

import { tailwindConfig } from '../tailwind-config';

function linkWithoutProtocol(url: string) {
	return url.replace(/^https?:\/\//, '');
}

interface ContactForwardEmailProps {
	baseUrl: string;
	contactEmail: string;
	contactMessage: string;
	contactName: string;
	salutation: string;
}

export default function ContactForwardEmail({
	baseUrl = 'https://next.tsg-irlich.de',
	contactEmail = 'info@tsg-irlich.de',
	contactMessage = 'Hallo liebes Team von der TSG Irlich! Ich wende mich folgendem Anliegen an euch...',
	contactName = 'Max Mustermann',
	salutation = 'Hallo liebes PR-Team!',
}: ContactForwardEmailProps) {
	return (
		<Html>
			<Head />

			<Tailwind config={tailwindConfig}>
				<Body className="mx-auto my-auto box-border bg-white px-2 font-sans">
					<Preview>{`Von ${baseUrl} kommt eine Anfrage von ${contactName}.`}</Preview>

					<Container className="border-border mx-auto my-10 max-w-2xl rounded border border-solid p-5">
						<Section className="mt-[32px] flex justify-center">
							<TSGLogo className="h-32" />
						</Section>

						<Heading className="my-[30px] text-center text-2xl text-black">
							Neue Nachricht über{' '}
							<Link className="text-primary" href={baseUrl}>
								{linkWithoutProtocol(baseUrl)}
							</Link>
							!
						</Heading>

						<Section>
							<Text className="text-base">{salutation}</Text>
							<Text className="text-base">
								<strong>{contactName}</strong> &lt;
								<Link className="text-primary" href={`mailto:${contactEmail}`}>
									{contactEmail}
								</Link>
								&gt; hat dir eine Nachricht gesendet:
							</Text>
							<Text className="bg-background-high-contrast rounded-xl p-4 text-base italic">
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
