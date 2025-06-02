import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const soccer = getGroupDocument({
	title: 'Fußball',
	name: 'group.soccer',
	icon: RiTeamLine,
});

export default soccer;
