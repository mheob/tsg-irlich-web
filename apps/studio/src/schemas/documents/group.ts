import { RiTeamLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const group = defineType({
	title: 'Gruppe',
	name: 'group',
	type: 'document',
	icon: RiTeamLine,
	fields: [
		{
			title: 'Name',
			name: 'title',
			type: 'string',
			validation: rule => [
				rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Der Name muss weniger als 64 Zeichen lang sein.'),
			],
		},
		// TODO: add all needed fields
	],
});

export default group;
