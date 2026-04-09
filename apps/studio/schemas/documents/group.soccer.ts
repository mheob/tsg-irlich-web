import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const soccer = getGroupDocument({
	icon: RiTeamLine,
	name: 'group.soccer',
	title: 'Fußball',
});

export default soccer;
