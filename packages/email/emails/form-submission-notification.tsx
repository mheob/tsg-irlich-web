import { Body, Container, Head, Heading, Html, Link, Preview, Tailwind, Text } from 'react-email';

import { AnswerSections } from '../components/form/answer-sections';
import type { EmailAnswerSection } from '../components/form/answer-sections';
import { tailwindConfig } from '../tailwind.config';

function FormSubmissionNotificationEmail({
	formTitle,
	hasHiddenFields,
	sections,
	status,
	studioUrl,
}: Readonly<FormSubmissionNotificationEmailProps>) {
	const statusLabel = status === 'waitlist' ? 'Warteliste' : 'angemeldet';

	return (
		<Html lang="de">
			<Head />

			<Tailwind config={tailwindConfig}>
				<Body className="m-auto bg-background px-2 font-sans">
					<Preview>{`Neuer Eingang: ${formTitle}`}</Preview>

					<Container className="mx-auto my-10 max-w-2xl rounded-sm border border-solid border-border p-5">
						<Heading className="my-[30px] text-2xl text-black">{`Neuer Eingang: ${formTitle}`}</Heading>

						<Text className="text-base">{`Status: ${statusLabel}`}</Text>

						<AnswerSections sections={sections} />

						{hasHiddenFields ? (
							<Text className="text-sm">Adressen und Geburtsdaten stehen nur im Studio.</Text>
						) : null}

						<Text className="text-base">
							<Link className="text-primary" href={studioUrl}>
								Eingang im Studio öffnen
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

interface FormSubmissionNotificationEmailProps {
	formTitle: string;
	hasHiddenFields: boolean;
	sections: EmailAnswerSection[];
	status: 'registered' | 'waitlist';
	studioUrl: string;
}

export { FormSubmissionNotificationEmail };
export default FormSubmissionNotificationEmail;
