import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const courses = getGroupDocument({
	title: 'Kurse',
	name: 'group.courses',
	icon: RiTeamLine,
});

export default courses;
