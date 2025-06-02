import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const admin = getGroupDocument({
	title: 'Administration',
	name: 'group.admin',
	icon: RiTeamLine,
	isSportGroup: false,
});

export default admin;
