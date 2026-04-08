import { RiTeamLine } from 'react-icons/ri';

import { getGroupDocument } from '@/utils/documents';

const otherSports = getGroupDocument({
	icon: RiTeamLine,
	name: 'group.other-sports',
	title: 'Weitere Sportarten',
});

export default otherSports;
