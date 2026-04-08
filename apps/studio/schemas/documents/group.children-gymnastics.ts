import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const childrenGymnastics = getGroupDocument({
	icon: RiTeamLine,
	name: 'group.children-gymnastics',
	title: 'Kinderturnen',
});

export default childrenGymnastics;
