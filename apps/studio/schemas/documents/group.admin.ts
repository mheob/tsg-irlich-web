import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const admin = getGroupDocument({
	icon: RiTeamLine,
	isSportGroup: false,
	name: 'group.admin',
	title: 'Administration',
});

export default admin;
