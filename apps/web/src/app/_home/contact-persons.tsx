import type { ComponentProps } from 'react';

import ContactPersonGroup from '@/components/ui/contact-persons';
import SectionHeader from '@/components/ui/section-header';

import styles from './contact-persons.module.css';

const contactPersons: ComponentProps<typeof ContactPersonGroup>['contactPersons'] = [
	{
		email: 'test@test.com',
		firstName: 'Alexander',
		imageSrc: '',
		lastName: 'Hof',
		phone: '1234567890',
		role: 'CEO',
		vision: 'Lorem ipsum dolor sit amet.',
	},
	{
		email: 'test@test.com',
		firstName: 'René',
		imageSrc: '',
		lastName: 'Linn',
		phone: '1234567890',
		role: 'CEO',
		vision:
			'Mir ist wichtig das Ehrenamt zu einer tragenden Säule unseres Vereins zu machen, die nicht nur das Fundament unserer Gemeinschaft stärkt, sondern auch Freude und Erfüllung in der Mitgestaltung bietet. Wir streben danach, gemeinsam den Verein in seinem Sportangebot zu erweitern und seine finanzielle Stabilität kontinuierlich zu sichern. Dabei soll eine Balance zwischen den Abteilungen gewährleistet sein, sodass keine Abteilung bevorzugt wird und alle Sportarten fair und ihren individuellen Bedürfnissen entsprechend gefördert werden.',
	},
	{
		email: 'test@test.com',
		firstName: 'Melina',
		imageSrc: '',
		lastName: 'Dinter',
		phone: '1234567890',
		role: 'CEO',
		vision:
			'Die Arbeit in der Verwaltung macht mir großen Spaß und es erfüllt mich mit Freude, unsere Mitglieder glücklich und motiviert beim Sport zu sehen. Ein wichtiger Aspekt meiner Tätigkeit ist es, unseren Verein nach und nach aus dem alten Trott herauszuführen und neue Ideen und Innovationen einzubringen. Eine gute Zusammenarbeit ist dabei Fundament. Nur durch Teamarbeit können wir unsere Ziele erreichen und den Verein voranbringen. Es sind noch viele Projekte und Herausforderungen offen, aber ich bin überzeugt, dass wir gemeinsam viel bewegen können.',
	},
	{
		email: 'test@test.com',
		firstName: 'Philipp',
		imageSrc: '',
		lastName: 'Pfeiffer',
		phone: '1234567890',
		role: 'CEO',
		vision:
			'Als Vorstandsmitglied im Bereich Öffentlichkeitsarbeit ist es mein Ziel, unseren Verein kontinuierlich weiterzuentwickeln und für eine gute Zukunft zu sorgen. Die Öffentlichkeitsarbeit spielt dabei eine entscheidende Rolle, denn sie verbindet unsere Mitglieder, stärkt unser Gemeinschaftsgefühl und zeigt der Welt, wer wir sind und wofür wir stehen. Durch eine moderne und ansprechende Außendarstellung wollen wir unsere Reichweite erhöhen, denn nur gemeinsam mit einem starken und engagierten Team können wir unsere Ziele erreichen und unseren Verein weiter voranbringen.',
	},
	{
		email: 'test@test.com',
		firstName: 'Melanie',
		imageSrc: '',
		lastName: 'Klein',
		phone: '1234567890',
		role: 'CEO',
		vision:
			'Als Abteilungsleiterin im Bereich Breitensport liegt mir besonders am Herzen, die Vielfalt unseres Vereins zu erhalten und weiter zu verbessern. Durch ein vielfältiges und abwechslungsreiches Programm möchte ich die Begeisterung für Sport wecken und langfristig erhalten. Ein offener und freundlicher Umgang miteinander bietet dabei die Grundlage für eine starke und harmonische Gemeinschaft.',
	},
	{
		email: 'test@test.com',
		firstName: 'Dennis',
		imageSrc: '',
		lastName: 'Marschke',
		phone: '1234567890',
		role: 'CEO',
		vision:
			'Als Abteilungsleiter im Bereich Fußball ist es mein Ziel, den Verein bei seinen Zielen zu unterstützen und gleichzeitig eigene Ideen einzubringen, um den Fußballbereich weiter zu stärken und attraktiv zu halten. Die Förderung unseres Vereins und insbesondere des Fußballs, sowie ein starkes Miteinander und der Zusammenhalt liegen mir sehr am Herzen. Die Größe und Vielfalt unseres Vereins bieten uns viele Chancen, die wir gemeinsam nutzen können.',
	},
];

export default function ContactPersons() {
	return (
		<section className={`${styles.bg} bg-primary text-primary-foreground relative z-0`}>
			<div className="container mx-auto px-5 pb-40 pt-28">
				<SectionHeader
					descriptionClassName="text-primary-foreground"
					subTitle="Ansprechpartner"
					title="Wir sind für dich da"
					isCentered
				>
					Lorem ipsum dolor sit amet consectetur. Adipiscing in eu tempus feugiat enim placerat.
					Cursus commodo lorem sit fringilla augue.
				</SectionHeader>

				<div className="mt-32 flex justify-center gap-12">
					<ContactPersonGroup contactPersons={contactPersons} />
				</div>
			</div>
		</section>
	);
}
