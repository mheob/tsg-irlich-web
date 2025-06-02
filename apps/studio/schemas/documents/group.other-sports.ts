import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const otherSports = getGroupDocument({
	title: 'Weitere Sportarten',
	name: 'group.other-sports',
	icon: RiTeamLine,
});

export default otherSports;
