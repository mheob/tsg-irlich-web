import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const taekwondo = getGroupDocument({
	icon: RiTeamLine,
	name: 'group.taekwondo',
	title: 'Taekwondo',
});

export default taekwondo;
