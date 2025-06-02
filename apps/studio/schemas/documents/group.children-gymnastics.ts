import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const childrenGymnastics = getGroupDocument({
	title: 'Kinderturnen',
	name: 'group.children-gymnastics',
	icon: RiTeamLine,
});

export default childrenGymnastics;
