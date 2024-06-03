import { defineField } from 'sanity';

import extendedImage from '../objects/extended-image';

const mainImage = defineField({
	...extendedImage,
	title: 'Image',
	name: 'mainImage',
});

export default mainImage;
