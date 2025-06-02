export const DEPARTMENTS = [
	{ slug: 'admin', title: 'Administration', type: 'group.admin' },
	{ slug: 'children-gymnastics', title: 'Kinderturnen', type: 'group.children-gymnastics' },
	{ slug: 'courses', title: 'Kurse', type: 'group.courses' },
	{ slug: 'dance', title: 'Tanzen', type: 'group.dance' },
	{ slug: 'other-sports', title: 'Weitere Sportarten', type: 'group.other-sports' },
	{ slug: 'soccer', title: 'Fussball', type: 'group.soccer' },
	{ slug: 'taekwondo', title: 'Taekwondo', type: 'group.taekwondo' },
] as const;

export type Department = (typeof DEPARTMENTS)[number];
