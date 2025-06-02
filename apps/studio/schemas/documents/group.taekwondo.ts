import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const taekwondo = getGroupDocument({
	title: 'Taekwondo',
	name: 'group.taekwondo',
	icon: RiTeamLine,
});

export default taekwondo;
