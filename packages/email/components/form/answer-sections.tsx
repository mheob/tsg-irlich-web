import { Heading, Section, Text } from 'react-email';

import { LineBreaks } from './line-breaks';

interface EmailAnswerSection {
	heading?: string;
	rows: { label: string; value: string }[];
}

function AnswerSections({ sections }: Readonly<AnswerSectionsProps>) {
	return (
		<>
			{sections.map((section, sectionIndex) => (
				// oxlint-disable-next-line react/no-array-index-key
				<Section key={`${sectionIndex}-${section.heading ?? ''}`}>
					{section.heading ? (
						<Heading as="h2" className="mt-6 mb-2 text-lg text-black">
							{section.heading}
						</Heading>
					) : null}
					{section.rows.map((row, rowIndex) => (
						// oxlint-disable-next-line react/no-array-index-key
						<Text className="my-1 text-base" key={`${rowIndex}-${row.label}`}>
							<strong>{row.label}:</strong> <LineBreaks text={row.value} />
						</Text>
					))}
				</Section>
			))}
		</>
	);
}

interface AnswerSectionsProps {
	sections: EmailAnswerSection[];
}

export { AnswerSections };
export type { EmailAnswerSection };
