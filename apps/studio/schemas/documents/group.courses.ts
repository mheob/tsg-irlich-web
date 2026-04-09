import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const courses = getGroupDocument({
	icon: RiTeamLine,
	name: 'group.courses',
	title: 'Kurse',
});

export default courses;
