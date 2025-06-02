import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const dance = getGroupDocument({
	title: 'Tanzen',
	name: 'group.dance',
	icon: RiTeamLine,
});

export default dance;
