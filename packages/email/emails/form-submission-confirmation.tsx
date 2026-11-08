import { Body, Container, Head, Html, Preview, Tailwind, Text } from 'react-email';

import { AnswerSections } from '../components/form/answer-sections';
import type { EmailAnswerSection } from '../components/form/answer-sections';
import { tailwindConfig } from '../tailwind.config';

function FormSubmissionConfirmationEmail({
	formTitle,
	hasHiddenFields,
	sections,
	text,
}: Readonly<FormSubmissionConfirmationEmailProps>) {
	const paragraphs = text.split(/\n\s*\n/u);

	return (
		<Html lang="de">
			<Head />

			<Tailwind config={tailwindConfig}>
				<Body className="m-auto bg-background px-2 font-sans">
					<Preview>{formTitle}</Preview>

					<Container className="mx-auto my-10 max-w-2xl rounded-sm border border-solid border-border p-5">
						{paragraphs.map((paragraph, index) => (
							// oxlint-disable-next-line react/no-array-index-key
							<Text className="text-base" key={`${index}-${paragraph}`}>
								{paragraph}
							</Text>
						))}

						{sections ? (
							<>
								<AnswerSections sections={sections} />
								{hasHiddenFields ? (
									<Text className="text-sm">
										Adressen und Geburtsdaten führen wir hier nicht auf.
									</Text>
								) : null}
							</>
						) : null}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

interface FormSubmissionConfirmationEmailProps {
	formTitle: string;
	hasHiddenFields: boolean;
	sections?: EmailAnswerSection[];
	text: string;
}

export { FormSubmissionConfirmationEmail };
export default FormSubmissionConfirmationEmail;
